from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import repo, chat

app = FastAPI(title="Codebase Atlas API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repo.router, prefix="/api/repo", tags=["repo"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/health")
def health():
    return {"status": "ok"}
