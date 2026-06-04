from pydantic import BaseModel
from typing import Optional

class FileNode(BaseModel):
    id: str
    label: str
    path: str
    extension: str
    size: int
    commit_count: int       # how many times this file changed
    lines: int
    node_type: str          # "file" | "directory"
    language: str

class ImportEdge(BaseModel):
    id: str
    source: str
    target: str
    weight: float           # normalized import strength

class RepoGraph(BaseModel):
    repo: str
    nodes: list[FileNode]
    edges: list[ImportEdge]
    stats: dict

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    repo_context: Optional[str] = None
