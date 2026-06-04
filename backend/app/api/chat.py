from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.graph import ChatRequest
from app.core.config import settings
import httpx
import json

router = APIRouter()

SYSTEM_PROMPT = """You are Codebase Atlas AI — an expert software architect assistant.
You help developers understand codebases by analyzing their structure, dependencies, and architecture.
When given repo context (file list, import graph, stats), answer questions precisely.
Be concise but insightful. Focus on architecture, patterns, hotspots, and actionable insights.
Format responses with markdown. Use code blocks when referencing files or code."""

@router.post("/stream")
async def chat_stream(req: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    
    if req.repo_context:
        messages = [{"role": "user", "content": f"Repo context:\n{req.repo_context}"},
                    {"role": "assistant", "content": "Got it. I've analyzed the repo structure. Ask me anything about this codebase."},
                    *messages]

    async def generate():
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-5-haiku-20241022",
                    "max_tokens": 1024,
                    "system": SYSTEM_PROMPT,
                    "messages": messages,
                    "stream": True,
                }
            ) as resp:
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            event = json.loads(data)
                            if event.get("type") == "content_block_delta":
                                text = event["delta"].get("text", "")
                                if text:
                                    yield f"data: {json.dumps({'text': text})}\n\n"
                        except Exception:
                            pass
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
