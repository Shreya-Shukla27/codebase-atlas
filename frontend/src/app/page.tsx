"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  { owner: "facebook", repo: "react", desc: "UI library" },
  { owner: "vercel", repo: "next.js", desc: "React framework" },
  { owner: "tiangolo", repo: "fastapi", desc: "Python API" },
  { owner: "microsoft", repo: "vscode", desc: "Code editor" },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function parseInput(val: string): { owner: string; repo: string } | null {
    const clean = val.trim().replace(/^https?:\/\/github\.com\//, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInput(input);
    if (!parsed) {
      setError("Enter a GitHub URL or owner/repo format");
      return;
    }
    router.push(`/atlas/${parsed.owner}/${parsed.repo}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="starfield" />

      {/* Animated bg orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, #6366f1, transparent)", filter: "blur(60px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, #4f8ef7, transparent)", filter: "blur(60px)" }} />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-2xl px-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 opacity-60 animate-spin-slow" />
              <div className="absolute inset-2 rounded-full bg-blue-500 opacity-80" />
              <div className="absolute inset-3 rounded-full bg-white opacity-90" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Codebase Atlas
            </h1>
          </div>
          <p className="text-atlas-dim text-center text-sm leading-relaxed max-w-md">
            Visualize any GitHub repo as an interactive galaxy. Files are planets —
            the more commits, the brighter they glow.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setError(""); }}
              placeholder="github.com/owner/repo or owner/repo"
              className="flex-1 bg-atlas-surface border border-atlas-border rounded-lg px-4 py-3 text-sm text-atlas-text placeholder-atlas-dim focus:outline-none focus:border-atlas-accent transition-colors font-mono"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-atlas-accent text-white rounded-lg text-sm font-medium hover:bg-blue-500 active:scale-95 transition-all"
            >
              Explore
            </button>
          </div>
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
        </form>

        {/* Examples */}
        <div className="w-full">
          <p className="text-atlas-dim text-xs mb-3 font-mono uppercase tracking-wider">Try these</p>
          <div className="grid grid-cols-2 gap-2">
            {EXAMPLES.map(ex => (
              <button
                key={ex.repo}
                onClick={() => router.push(`/atlas/${ex.owner}/${ex.repo}`)}
                className="flex items-center justify-between bg-atlas-surface border border-atlas-border rounded-lg px-4 py-3 hover:border-atlas-accent transition-colors text-left group"
              >
                <div>
                  <p className="text-sm text-atlas-text font-mono group-hover:text-white transition-colors">
                    {ex.owner}/{ex.repo}
                  </p>
                  <p className="text-xs text-atlas-dim">{ex.desc}</p>
                </div>
                <span className="text-atlas-dim group-hover:text-atlas-accent text-lg transition-colors">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {["Import Graph", "Commit Heatmap", "Language View", "AI Chat"].map(f => (
            <span key={f} className="px-3 py-1 bg-atlas-surface border border-atlas-border rounded-full text-xs text-atlas-dim font-mono">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
