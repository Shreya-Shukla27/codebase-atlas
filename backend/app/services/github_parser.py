import httpx
import asyncio
import re
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

async def fetch_github_tree(owner: str, repo: str, token: str = "") -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    async with httpx.AsyncClient(timeout=30) as client:
        # Get default branch
        repo_resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=headers
        )
        repo_resp.raise_for_status()
        default_branch = repo_resp.json().get("default_branch", "main")
        
        # Get full tree recursively
        tree_resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1",
            headers=headers
        )
        tree_resp.raise_for_status()
        return tree_resp.json(), default_branch

async def fetch_commits_per_file(owner: str, repo: str, token: str = "") -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    commit_counts = defaultdict(int)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=100",
            headers=headers
        )
        if resp.status_code != 200:
            return commit_counts
        
        commits = resp.json()
        # Sample first 30 commits for speed
        for commit in commits[:30]:
            sha = commit["sha"]
            detail = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}",
                headers=headers
            )
            if detail.status_code == 200:
                files = detail.json().get("files", [])
                for f in files:
                    commit_counts[f["filename"]] += 1
    
    return commit_counts

async def fetch_file_content(owner: str, repo: str, path: str, branch: str, token: str = "") -> str:
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}",
            headers=headers
        )
        if resp.status_code != 200:
            return ""
        data = resp.json()
        if data.get("encoding") == "base64":
            import base64
            return base64.b64decode(data["content"]).decode("utf-8", errors="ignore")
    return ""

def extract_imports(content: str, ext: str) -> list[str]:
    patterns = IMPORT_PATTERNS.get(ext, [])
    imports = []
    for pattern in patterns:
        matches = re.findall(pattern, content, re.MULTILINE)
        imports.extend(matches)
    return imports

def resolve_import_to_file(imp: str, source_path: str, all_paths: set) -> str | None:
    """Try to resolve an import (relative or absolute) to an actual file path.

    - Relative imports (start with '.') are resolved relative to the source file.
    - Absolute imports are mapped by converting module paths to file paths and
      trying common repo prefixes (e.g. '', 'src/', 'app/', 'lib/'). This handles
      many real-world absolute import styles without assuming package-level installs.
    """
    # Helper to test candidate paths using known extensions
    def _test_candidates(base: str) -> str | None:
        exts = [".py", ".ts", ".tsx", ".js", ".jsx"]
        for ext in exts:
            full = base + ext
            if full in all_paths:
                return full
            idx = base + "/index" + ext
            if idx in all_paths:
                return idx
        # Also try __init__.py style packages
        if base + "/__init__.py" in all_paths:
            return base + "/__init__.py"
        return None

    # 1) Relative imports (existing behavior)
    if imp.startswith("."):
        source_dir = "/".join(source_path.split("/")[:-1])
        candidate = source_dir + "/" + imp.lstrip("./")
        resolved = _test_candidates(candidate)
        if resolved:
            return resolved
        return None

    # 2) Absolute-style imports: try to map module paths to repo file paths.
    # Normalize TypeScript/JS alias syntax like '@/utils' => 'utils'
    norm = imp.lstrip("@/") if imp.startswith("@/") else imp

    # For Python dotted imports, convert dots to slashes
    if "." in norm and not norm.startswith("/"):
        mod_path = norm.replace('.', '/')
    else:
        mod_path = norm

    # Common repo prefixes to try — adapt to project layouts
    prefixes = ["", "src/", "app/", "lib/", "backend/", "frontend/src/"]

    for p in prefixes:
        base = p + mod_path
        resolved = _test_candidates(base)
        if resolved:
            return resolved

    # As a fallback, try only the last path component (e.g., import 'foo.bar' -> 'bar')
    last = mod_path.split('/')[-1]
    for p in prefixes:
        resolved = _test_candidates(p + last)
        if resolved:
            return resolved

    return None

async def build_repo_graph(owner: str, repo: str) -> RepoGraph:
    token = settings.GITHUB_TOKEN
    
    tree_data, branch = await fetch_github_tree(owner, repo, token)
    all_items = tree_data.get("tree", [])
    
    # Filter to source files only, skip node_modules, dist, etc.
    SKIP_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__", ".next", "vendor", "venv"}
    
    files = []
    for item in all_items:
        if item["type"] != "blob":
            continue
        path = item["path"]
        parts = path.split("/")
        if any(p in SKIP_DIRS for p in parts):
            continue
        ext = "." + path.split(".")[-1] if "." in path else ""
        if ext not in LANG_MAP:
            continue
        files.append(item)
    
    # Limit to 80 files for performance
    files = files[:80]
    all_paths = {f["path"] for f in files}
    
    # Fetch commit counts
    commit_counts = await fetch_commits_per_file(owner, repo, token)
    
    # Build nodes
    nodes = []
    edges = []
    edge_set = set()
    
    # Fetch content for small files to extract imports
    content_tasks = []
    small_files = [f for f in files if f.get("size", 999999) < 50000][:40]
    
    for f in small_files:
        content_tasks.append(
            fetch_file_content(owner, repo, f["path"], branch, token)
        )
    
    contents = await asyncio.gather(*content_tasks, return_exceptions=True)
    content_map = {}
    for i, f in enumerate(small_files):
        if not isinstance(contents[i], Exception):
            content_map[f["path"]] = contents[i]
    
    for f in files:
        path = f["path"]
        ext = "." + path.split(".")[-1] if "." in path else ""
        filename = path.split("/")[-1]
        content = content_map.get(path, "")
        lines = content.count("\n") + 1 if content else 0
        
        node = FileNode(
            id=path,
            label=filename,
            path=path,
            extension=ext,
            size=f.get("size", 0),
            commit_count=commit_counts.get(path, 0),
            lines=lines,
            node_type="file",
            language=LANG_MAP.get(ext, "Other"),
        )
        nodes.append(node)
        
        # Extract imports and create edges
        if content:
            imports = extract_imports(content, ext)
            for imp in imports:
                target = resolve_import_to_file(imp, path, all_paths)
                if target and target != path:
                    edge_id = f"{path}->{target}"
                    if edge_id not in edge_set:
                        edge_set.add(edge_id)
                        edges.append(ImportEdge(
                            id=edge_id,
                            source=path,
                            target=target,
                            weight=1.0,
                        ))
    
    # Stats
    lang_counts = defaultdict(int)
    for n in nodes:
        lang_counts[n.language] += 1
    
    max_commits = max((n.commit_count for n in nodes), default=1) or 1
    
    stats = {
        "total_files": len(nodes),
        "total_edges": len(edges),
        "languages": dict(lang_counts),
        "most_changed": sorted(
            [{"file": n.label, "path": n.path, "count": n.commit_count} for n in nodes],
            key=lambda x: x["count"], reverse=True
        )[:5],
        "max_commits": max_commits,
    }
    
    return RepoGraph(
        repo=f"{owner}/{repo}",
        nodes=nodes,
        edges=edges,
        stats=stats,
    )
