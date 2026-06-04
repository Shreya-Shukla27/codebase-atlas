const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchRepoGraph(owner: string, repo: string) {
  const res = await fetch(`${API_BASE}/api/repo/${owner}/${repo}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function* streamChat(
  messages: Array<{ role: string; content: string }>,
  repoContext?: string
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, repo_context: repoContext }),
  });

  if (!res.ok) throw new Error("Chat stream failed");
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) yield parsed.text;
        } catch {}
      }
    }
  }
}
