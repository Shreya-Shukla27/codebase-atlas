"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

/* Lazy-load the 3D background so it doesn't block initial paint */
const StarField3D = dynamic(() => import("@/components/StarField3D"), {
  ssr: false,
  loading: () => null,
});

const EXAMPLES = [
  { owner: "facebook", repo: "react", desc: "UI library", icon: "⚛️" },
  { owner: "vercel", repo: "next.js", desc: "React framework", icon: "▲" },
  { owner: "tiangolo", repo: "fastapi", desc: "Python API", icon: "⚡" },
  { owner: "microsoft", repo: "vscode", desc: "Code editor", icon: "💎" },
];

const FEATURES = [
  { label: "Import Graph", icon: "🔗" },
  { label: "Commit Heatmap", icon: "🔥" },
  { label: "Language View", icon: "🎨" },
  { label: "AI Chat", icon: "🤖" },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
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
      {/* 3D Animated Background */}
      <Suspense fallback={null}>
        <StarField3D />
      </Suspense>

      {/* Gradient overlays for depth */}
      <div className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(5, 8, 16, 0.4) 60%, rgba(5, 8, 16, 0.85) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-2xl px-6">

        {/* ─── Open Source Badge ─── */}
        <div className="animate-fade-in-up">
          <a
            href="https://github.com/Shreya-Shukla27/codebase-atlas"
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-full px-4 py-1.5 text-xs font-mono text-atlas-dim hover:text-atlas-accent transition-colors flex items-center gap-2 group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Open Source on GitHub
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        </div>

        {/* ─── Header ─── */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up delay-100">
          {/* Animated planet logo */}
          <div className="relative w-16 h-16 mb-2">
            <div className="absolute inset-0 rounded-full border-2 border-atlas-accent/40 animate-spin-slow" />
            <div className="absolute inset-1 rounded-full border border-atlas-glow/30 animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "12s" }} />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-atlas-accent to-atlas-glow opacity-80 shadow-lg shadow-atlas-accent/30" />
            <div className="absolute inset-[14px] rounded-full bg-white/90" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-shimmer"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            Codebase Atlas
          </h1>
          <p className="text-atlas-dim text-center text-base leading-relaxed max-w-lg">
            Visualize any GitHub repo as an interactive galaxy.
            <br />
            <span className="text-atlas-text/70">Files are planets — the more commits, the brighter they glow.</span>
          </p>
        </div>

        {/* ─── Search Bar ─── */}
        <form onSubmit={handleSubmit} className="w-full animate-fade-in-up delay-300">
          <div className={`flex gap-2 glass rounded-xl p-1.5 transition-all duration-300 ${focused ? "border-atlas-accent/50 shadow-lg shadow-atlas-accent/10" : ""}`}>
            <div className="flex-1 flex items-center gap-3 px-3">
              <svg className="w-4 h-4 text-atlas-dim flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={input}
                onChange={e => { setInput(e.target.value); setError(""); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="github.com/owner/repo or owner/repo"
                className="flex-1 bg-transparent py-3 text-sm text-atlas-text placeholder-atlas-dim/60 focus:outline-none font-mono"
                id="repo-input"
              />
            </div>
            <button
              type="submit"
              id="explore-button"
              className="px-8 py-3 bg-gradient-to-r from-atlas-accent to-atlas-glow text-white rounded-lg text-sm font-semibold btn-glow active:scale-95 transition-transform"
            >
              Explore
            </button>
          </div>
          {error && <p className="text-red-400 text-xs font-mono mt-2 ml-2">{error}</p>}
        </form>

        {/* ─── Example Repos ─── */}
        <div className="w-full animate-fade-in-up delay-400">
          <p className="text-atlas-dim text-xs mb-3 font-mono uppercase tracking-wider flex items-center gap-2">
            <span className="w-8 h-px bg-atlas-border" />
            Try these
            <span className="w-8 h-px bg-atlas-border" />
          </p>
          <div className="grid grid-cols-2 gap-3">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.repo}
                id={`example-${ex.owner}-${ex.repo}`}
                onClick={() => router.push(`/atlas/${ex.owner}/${ex.repo}`)}
                className={`glass glass-hover rounded-xl px-4 py-3.5 text-left group transition-all duration-300 relative overflow-hidden animate-fade-in-scale delay-${(i + 5) * 100}`}
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-atlas-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{ex.icon}</span>
                    <div>
                      <p className="text-sm text-atlas-text font-mono group-hover:text-white transition-colors">
                        {ex.owner}/{ex.repo}
                      </p>
                      <p className="text-xs text-atlas-dim mt-0.5">{ex.desc}</p>
                    </div>
                  </div>
                  <span className="text-atlas-dim group-hover:text-atlas-accent text-lg transition-all group-hover:translate-x-1">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Features ─── */}
        <div className="flex flex-wrap gap-3 justify-center animate-fade-in-up delay-700">
          {FEATURES.map(f => (
            <span
              key={f.label}
              className="glass rounded-full px-4 py-2 text-xs text-atlas-dim font-mono flex items-center gap-2 hover:text-atlas-text hover:border-atlas-accent/30 transition-all cursor-default"
            >
              <span>{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* ─── Stats line ─── */}
        <div className="animate-fade-in-up delay-800">
          <p className="text-atlas-dim/50 text-xs font-mono text-center">
            Powered by React Flow · D3 · FastAPI · Claude AI
          </p>
        </div>
      </div>
    </div>
  );
}
