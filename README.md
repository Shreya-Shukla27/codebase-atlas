# ✦ Codebase Atlas

> Visualize any GitHub repo as an interactive galaxy. Files are planets- the more commits, the brighter they glow.

![Stack](https://img.shields.io/badge/Next.js_14-black?style=flat&logo=next.js) ![Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) ![Stack](https://img.shields.io/badge/React_Flow-FF0072?style=flat&logo=react&logoColor=white)

## 🚀 Live Demo

| | Link |
|---|---|
| **Frontend (Vercel)** | [https://atlas-ai-shreya27.vercel.app](https://atlas-ai-shreya27.vercel.app) |
| **Backend API (Render)** | [https://codebase-atlas.onrender.com](https://codebase-atlas.onrender.com) |

> **Note:** The backend is hosted on Render's free tier and may take ~30-60 seconds to wake up on first request after inactivity.

---

## Features

- **Galaxy Visualization**- React Flow graph with circular orbital layout. File size = planet size, commit frequency = glow intensity
- **3 View Modes**- Commit Heatmap, Import Graph (dependency edges), Language Colors
- **Click to Inspect**- Select any planet to see file stats, imports, and dependents
- **AI Chat**- Ask Claude anything about the repo architecture (requires Anthropic API key)
- **Live Stats Panel**- Language breakdown, hottest files, total edges

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- GitHub Token (optional but recommended to avoid rate limits)
- Anthropic API Key (for AI chat feature)

---

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Start server
uvicorn app.main:app --reload --port 8000
```

**.env file:**

```env
GITHUB_TOKEN=ghp_your_token_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

Get a GitHub token at: https://github.com/settings/tokens (no scopes needed for public repos)
Get an Anthropic key at: https://console.anthropic.com

---

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.local.example .env.local
# .env.local already has NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Open http://localhost:3000

---

## How to Use

1. Enter a GitHub repo URL (e.g. `github.com/facebook/react` or just `facebook/react`)
2. Wait for the graph to build (~5-15 seconds depending on repo size)
3. **Explore the galaxy:**
   - Drag to pan, scroll to zoom
   - Click any planet to inspect that file
   - Switch modes in the top bar (Commit Heat / Imports / Language)
4. **Chat with AI**- click "AI Chat" in the top bar to ask questions about the architecture

---

## Architecture

```text
codebase-atlas/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app + CORS
│       ├── core/config.py       # Pydantic settings
│       ├── models/graph.py      # FileNode, ImportEdge, RepoGraph models
│       ├── services/
│       │   └── github_parser.py # GitHub API + AST import extraction
│       └── api/
│           ├── repo.py          # GET /api/repo/{owner}/{repo}
│           └── chat.py          # POST /api/chat/stream (SSE)
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx                      # Landing page
        │   └── atlas/[owner]/[repo]/page.tsx # Main visualization
        ├── components/
        │   ├── GalaxyGraph.tsx   # React Flow graph with planet nodes
        │   ├── StatsPanel.tsx    # Right sidebar- stats, hot files, node detail
        │   ├── ChatPanel.tsx     # AI chat sidebar with streaming
        │   └── TopBar.tsx        # Repo name, view mode switcher
        └── lib/
            ├── api.ts            # fetchRepoGraph, streamChat
            └── utils.ts          # Colors, node sizing, formatting
```

---

## How the Graph is Built

1. **Fetch GitHub tree**- recursive tree API call gets all file paths
2. **Filter**- skip `node_modules`, `dist`, `build`, etc. Keep source files only (max 80)
3. **Commit counts**- fetch last 30 commits, count touches per file (= glow intensity)
4. **Content fetch**- download small files (<50KB) to extract imports
5. **Import extraction**- regex patterns per language (Python, JS/TS, Go, Rust)
6. **Edge resolution**- resolve relative imports to actual file paths → edges
7. **Layout**- concentric rings, hottest files placed nearest center

---

## Extending

**Add a new language's imports:**
Edit `IMPORT_PATTERNS` in `backend/app/services/github_parser.py`

**Change node sizing:**
Edit `getNodeSize()` in `frontend/src/lib/utils.ts`

**Add a new view mode:**

1. Add to `ViewMode` type in `atlas/[owner]/[repo]/page.tsx`
2. Add button in `TopBar.tsx`
3. Handle the new mode in `GalaxyGraph.tsx` color logic

**Layout improvements**:

- The frontend `GalaxyGraph` component now uses a d3-force (force-directed) layout for better clustering and less random scattering on larger repos. Tweak layout constants inside `frontend/src/components/GalaxyGraph.tsx` (`CHARGE_STRENGTH`, `COLLIDE_PADDING`, `BASE_LINK_DISTANCE`, and `WARMUP_TICKS_PER_NODE`) to adjust the galaxy appearance.

---

## Known Limitations

- GitHub API rate limit: 60 req/hour unauthenticated, 5000/hour with token
- Import resolution only works for relative imports (not package imports like `react`)
- Large repos (500+ files) are capped at 80 files for performance
- Commit history fetches max 30 commits (enough for relative heat)

---

## Roadmap

- [ ] pgvector semantic file clustering
- [ ] Directory grouping (folder planets with file moons)
- [ ] GitHub Actions integration (show CI failure rates)
- [ ] Export graph as JSON / SVG
- [ ] Auth + save/compare multiple repos

---

Built as a portfolio project demonstrating: AST parsing · Graph layout algorithms · Streaming AI · React Flow · FastAPI SSE
