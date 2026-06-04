"use client";
import Link from "next/link";

type ViewMode = "imports" | "heatmap" | "language";

interface Props {
  repo: string;
  stats: { total_files: number; total_edges: number; languages: Record<string, number> };
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
}

const MODES: { id: ViewMode; label: string; desc: string }[] = [
  { id: "heatmap", label: "Commit Heat", desc: "Glow = change frequency" },
  { id: "imports", label: "Imports", desc: "Show dependency edges" },
  { id: "language", label: "Language", desc: "Color by language" },
];

export default function TopBar({ repo, stats, viewMode, setViewMode, chatOpen, setChatOpen }: Props) {
  const topLang = Object.entries(stats.languages).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="h-12 flex items-center justify-between px-4 border-b"
      style={{ background: "#0a0f1e", borderColor: "#1a2040" }}>

      {/* Left: logo + repo name */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 rounded-full border border-blue-500 opacity-60" />
            <div className="absolute inset-1 rounded-full bg-blue-500 opacity-80" />
          </div>
          <span className="text-xs text-atlas-dim font-mono hidden sm:block">Atlas</span>
        </Link>
        <div className="w-px h-4" style={{ background: "#1a2040" }} />
        <span className="text-sm text-white font-mono">{repo}</span>
        <div className="flex gap-3 text-xs text-atlas-dim font-mono">
          <span>{stats.total_files} files</span>
          <span>{stats.total_edges} edges</span>
          {topLang && <span>{topLang[0]}</span>}
        </div>
      </div>

      {/* Center: view mode */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "#050810", border: "1px solid #1a2040" }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            title={m.desc}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
              viewMode === m.id
                ? "bg-atlas-accent text-white"
                : "text-atlas-dim hover:text-white"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Right: chat toggle */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
          chatOpen
            ? "bg-atlas-accent text-white"
            : "border text-atlas-dim hover:text-white hover:border-atlas-accent"
        }`}
        style={!chatOpen ? { borderColor: "#1a2040" } : {}}
      >
        <span>⬡</span>
        <span>AI Chat</span>
      </button>
    </div>
  );
}
