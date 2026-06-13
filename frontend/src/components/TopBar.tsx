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
  statsOpen?: boolean;
  setStatsOpen?: (v: boolean) => void;
}

const MODES: { id: ViewMode; label: string; desc: string }[] = [
  { id: "heatmap", label: "Heat", desc: "Glow = change frequency" },
  { id: "imports", label: "Imports", desc: "Show dependency edges" },
  { id: "language", label: "Lang", desc: "Color by language" },
];

export default function TopBar({ repo, stats, viewMode, setViewMode, chatOpen, setChatOpen, statsOpen, setStatsOpen }: Props) {
  const topLang = Object.entries(stats.languages).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="flex flex-col border-b"
      style={{ background: "#0a0f1e", borderColor: "#1a2040" }}>

      {/* Main row */}
      <div className="h-12 flex items-center justify-between px-3 sm:px-4 gap-2">

        {/* Left: logo + repo name */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border border-blue-500 opacity-60" />
              <div className="absolute inset-1 rounded-full bg-blue-500 opacity-80" />
            </div>
            <span className="text-xs text-atlas-dim font-mono hidden sm:block">Atlas</span>
          </Link>
          <div className="w-px h-4 flex-shrink-0 hidden sm:block" style={{ background: "#1a2040" }} />
          <span className="text-sm text-white font-mono truncate">{repo}</span>
          <div className="hidden md:flex gap-3 text-xs text-atlas-dim font-mono flex-shrink-0">
            <span>{stats.total_files} files</span>
            <span>{stats.total_edges} edges</span>
            {topLang && <span>{topLang[0]}</span>}
          </div>
        </div>

        {/* Center: view mode (hidden on very small, shown on sm+) */}
        <div className="hidden sm:flex items-center gap-1 p-0.5 rounded-lg flex-shrink-0" style={{ background: "#050810", border: "1px solid #1a2040" }}>
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

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Stats toggle – mobile only */}
          {setStatsOpen && (
            <button
              onClick={() => setStatsOpen(!statsOpen)}
              className={`flex md:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                statsOpen
                  ? "bg-atlas-accent text-white"
                  : "border text-atlas-dim hover:text-white hover:border-atlas-accent"
              }`}
              style={!statsOpen ? { borderColor: "#1a2040" } : {}}
              title="Toggle stats panel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
              <span className="hidden xs:inline">Stats</span>
            </button>
          )}

          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              chatOpen
                ? "bg-atlas-accent text-white"
                : "border text-atlas-dim hover:text-white hover:border-atlas-accent"
            }`}
            style={!chatOpen ? { borderColor: "#1a2040" } : {}}
          >
            <span>⬡</span>
            <span className="hidden sm:inline">AI Chat</span>
          </button>
        </div>
      </div>

      {/* Mobile-only: View mode row */}
      <div className="flex sm:hidden items-center justify-center gap-1 px-3 pb-2">
        <div className="flex items-center gap-1 p-0.5 rounded-lg w-full justify-center" style={{ background: "#050810", border: "1px solid #1a2040" }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              title={m.desc}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === m.id
                  ? "bg-atlas-accent text-white"
                  : "text-atlas-dim hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
