import asyncio
import httpx
import ssl
import certifi
from app.core.config import settings

async def test():
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    transport = httpx.AsyncHTTPTransport(verify=ssl_context)
    async with httpx.AsyncClient(transport=transport, timeout=30) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama3-8b-8192",
                "max_tokens": 50,
                "messages": [{"role": "user", "content": "Say hello"}],
            }
        )
        print("status:", r.status_code)
        print("response:", r.text[:200])

asyncio.run(test())