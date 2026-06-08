from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.graph import ChatRequest
import httpx
import json
import ssl
import certifi
import os

router = APIRouter()

SYSTEM_PROMPT = """You are Codebase Atlas AI — an expert software architect assistant.
You help developers understand codebases by analyzing their structure, dependencies, and architecture.
When given repo context (file list, import graph, stats), answer questions precisely.
Be concise but insightful. Focus on architecture, patterns, hotspots, and actionable insights.
Format responses with markdown. Use code blocks when referencing files or code."""

@router.post("/stream")
async def chat_stream(req: ChatRequest):
    from app.core.config import settings
    groq_key = getattr(settings, "GROQ_API_KEY", "") or os.environ.get("GROQ_API_KEY", "")

    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    if req.repo_context:
        messages = [
            {"role": "user", "content": f"Repo context:\n{req.repo_context}"},
            {"role": "assistant", "content": "Got it. I've analyzed the repo structure. Ask me anything about this codebase."},
            *messages
        ]

    async def generate():
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        transport = httpx.AsyncHTTPTransport(verify=ssl_context)
        async with httpx.AsyncClient(transport=transport, timeout=60) as client:
            async with client.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "max_tokens": 1024,
                    "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
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
                            text = event["choices"][0]["delta"].get("content", "")
                            if text:
                                yield f"data: {json.dumps({'text': text})}\n\n"
                        except Exception:
                            pass
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")