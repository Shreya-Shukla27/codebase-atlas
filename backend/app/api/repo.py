from fastapi import APIRouter, HTTPException
from app.services.github_parser import build_repo_graph
from app.models.graph import RepoGraph
import traceback

router = APIRouter()

@router.get("/{owner}/{repo}", response_model=RepoGraph)
async def get_repo_graph(owner: str, repo: str):
    try:
        graph = await build_repo_graph(owner, repo)
        return graph
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))