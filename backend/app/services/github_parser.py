import httpx
import asyncio
import re
import ssl
import certifi
from collections import defaultdict
from app.models.graph import FileNode, ImportEdge, RepoGraph
from app.core.config import settings

LANG_MAP = {
    ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
    ".tsx": "TypeScript", ".jsx": "JavaScript", ".java": "Java",
    ".go": "Go", ".rs": "Rust", ".cpp": "C++", ".c": "C",
    ".cs": "C#", ".rb": "Ruby", ".php": "PHP", ".swift": "Swift",
    ".kt": "Kotlin", ".md": "Markdown", ".json": "JSON",
    ".yaml": "YAML", ".yml": "YAML", ".html": "HTML", ".css": "CSS",
    ".scss": "SCSS", ".vue": "Vue", ".svelte": "Svelte",
}

IMPORT_PATTERNS = {
    ".py": [r'^\s*import\s+([\w.]+)', r'^\s*from\s+([\w.]+)\s+import'],
    ".js": [r'(?:import|require)\s*\(?["\']([^"\']+)["\']'],
    ".ts": [r'(?:import|require)\s*\(?["\']([^"\']+)["\']'],
    ".tsx": [r'(?:import|require)\s*\(?["\']([^"\']+)["\']'],
    ".jsx": [r'(?:import|require)\s*\(?["\']([^"\']+)["\']'],
    ".go": [r'^\s*"([^"]+)"'],
    ".rs": [r'use\s+([\w:]+)'],
}

def make_client(timeout: int = 30) -> httpx.AsyncClient:
    """Create an httpx client with proper SSL and redirect handling for Windows."""
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    transport = httpx.AsyncHTTPTransport(verify=ssl_context)
    return httpx.AsyncClient(transport=transport, timeout=timeout, follow_redirects=True)

async def _get(client: httpx.AsyncClient, url: str, headers: dict) -> httpx.Response:
    resp = await client.get(url, headers=headers)
    if resp.status_code in (301, 302, 307, 308) and "location" in resp.headers:
        resp = await client.get(resp.headers["location"], headers=headers)
    return resp

async def fetch_github_tree(owner: str, repo: str, token: str = ""):
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with make_client(30) as client:
        repo_resp = await _get(client, f"https://api.github.com/repos/{owner}/{repo}", headers)
        repo_resp.raise_for_status()
        default_branch = repo_resp.json().get("default_branch", "main")

        tree_resp = await _get(
            client,
            f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1",
            headers
        )
        tree_resp.raise_for_status()
        return tree_resp.json(), default_branch

async def _fetch_commit_files(client, owner, repo, sha, headers):
    try:
        resp = await _get(client, f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}", headers)
        if resp.status_code in (403, 429):
            return []
        if resp.status_code == 200:
            return resp.json().get("files", [])
    except Exception:
        pass
    return []

async def fetch_commits_per_file(owner: str, repo: str, token: str = "") -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    commit_counts = defaultdict(int)
    async with make_client(30) as client:
        resp = await _get(client, f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=100", headers)
        if resp.status_code != 200:
            return commit_counts

        shas = [c["sha"] for c in resp.json()[:30]]
        results = await asyncio.gather(
            *[_fetch_commit_files(client, owner, repo, sha, headers) for sha in shas],
            return_exceptions=True
        )
        for files in results:
            if isinstance(files, Exception) or not files:
                continue
            for f in files:
                commit_counts[f["filename"]] += 1

    return commit_counts

async def fetch_file_content(owner: str, repo: str, path: str, branch: str, token: str = "") -> str:
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with make_client(15) as client:
        resp = await _get(client, f"https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}", headers)
        if resp.status_code != 200:
            return ""
        data = resp.json()
        if data.get("encoding") == "base64":
            import base64
            return base64.b64decode(data["content"]).decode("utf-8", errors="ignore")
    return ""

def extract_imports(content: str, ext: str) -> list:
    patterns = IMPORT_PATTERNS.get(ext, [])
    imports = []
    for pattern in patterns:
        imports.extend(re.findall(pattern, content, re.MULTILINE))
    return imports

def resolve_import_to_file(imp: str, source_path: str, all_paths: set):
    def _test(base):
        for ext in [".py", ".ts", ".tsx", ".js", ".jsx"]:
            if base + ext in all_paths: return base + ext
            if base + "/index" + ext in all_paths: return base + "/index" + ext
        if base + "/__init__.py" in all_paths: return base + "/__init__.py"
        return None

    if imp.startswith("."):
        source_dir = "/".join(source_path.split("/")[:-1])
        return _test(source_dir + "/" + imp.lstrip("./"))

    norm = imp.lstrip("@/") if imp.startswith("@/") else imp
    mod_path = norm.replace(".", "/") if "." in norm else norm

    for prefix in ["", "src/", "app/", "lib/"]:
        r = _test(prefix + mod_path)
        if r: return r

    last = mod_path.split("/")[-1]
    for prefix in ["", "src/", "app/", "lib/"]:
        r = _test(prefix + last)
        if r: return r

    return None

async def build_repo_graph(owner: str, repo: str) -> RepoGraph:
    token = settings.GITHUB_TOKEN
    tree_data, branch = await fetch_github_tree(owner, repo, token)
    all_items = tree_data.get("tree", [])

    SKIP_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__", ".next", "vendor", "venv", "docs", ".github"}
    files = []
    for item in all_items:
        if item["type"] != "blob": continue
        path = item["path"]
        if any(p in SKIP_DIRS for p in path.split("/")): continue
        ext = "." + path.split(".")[-1] if "." in path else ""
        if ext not in LANG_MAP: continue
        files.append(item)

    files = files[:80]
    all_paths = {f["path"] for f in files}
    commit_counts = await fetch_commits_per_file(owner, repo, token)

    small_files = [f for f in files if f.get("size", 999999) < 50000][:40]
    contents = await asyncio.gather(
        *[fetch_file_content(owner, repo, f["path"], branch, token) for f in small_files],
        return_exceptions=True
    )
    content_map = {f["path"]: c for f, c in zip(small_files, contents) if not isinstance(c, Exception)}

    nodes, edges, edge_set = [], [], set()

    for f in files:
        path = f["path"]
        ext = "." + path.split(".")[-1] if "." in path else ""
        content = content_map.get(path, "")
        node = FileNode(
            id=path, label=path.split("/")[-1], path=path,
            extension=ext, size=f.get("size", 0),
            commit_count=commit_counts.get(path, 0),
            lines=content.count("\n") + 1 if content else 0,
            node_type="file", language=LANG_MAP.get(ext, "Other"),
        )
        nodes.append(node)

        if content:
            for imp in extract_imports(content, ext):
                target = resolve_import_to_file(imp, path, all_paths)
                if target and target != path:
                    eid = f"{path}->{target}"
                    if eid not in edge_set:
                        edge_set.add(eid)
                        edges.append(ImportEdge(id=eid, source=path, target=target, weight=1.0))

    lang_counts = defaultdict(int)
    for n in nodes: lang_counts[n.language] += 1
    max_commits = max((n.commit_count for n in nodes), default=1) or 1

    return RepoGraph(
        repo=f"{owner}/{repo}", nodes=nodes, edges=edges,
        stats={
            "total_files": len(nodes), "total_edges": len(edges),
            "languages": dict(lang_counts),
            "most_changed": sorted(
                [{"file": n.label, "path": n.path, "count": n.commit_count} for n in nodes],
                key=lambda x: x["count"], reverse=True
            )[:5],
            "max_commits": max_commits,
        }
    )