import asyncio
import sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import sys
import traceback

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import repo, chat

app = FastAPI(title="Codebase Atlas API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repo.router, prefix="/api/repo", tags=["repo"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print(f"[UNHANDLED ERROR] {type(exc).__name__}: {exc}\n{tb}", flush=True)
    return JSONResponse(status_code=500, content={"detail": f"{type(exc).__name__}: {str(exc)}"})

@app.get("/health")
def health():
    return {"status": "ok"}
