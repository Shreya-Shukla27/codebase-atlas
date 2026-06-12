export const LANG_COLORS: Record<string, string> = {
  Python: "#3776ab",
  JavaScript: "#f7df1e",
  TypeScript: "#3178c6",
  Java: "#ed8b00",
  Go: "#00add8",
  Rust: "#ce422b",
  "C++": "#00599c",
  C: "#555555",
  "C#": "#239120",
  Ruby: "#cc342d",
  PHP: "#777bb4",
  Swift: "#f05138",
  Kotlin: "#7f52ff",
  Vue: "#4fc08d",
  Svelte: "#ff3e00",
  HTML: "#e34c26",
  CSS: "#1572b6",
  SCSS: "#cf649a",
  Markdown: "#083fa1",
  JSON: "#8bc34a",
  YAML: "#cb171e",
  Other: "#64748b",
};

export function getLangColor(lang: string): string {
  return LANG_COLORS[lang] || LANG_COLORS.Other;
}

export function getNodeSize(commitCount: number, maxCommits: number): number {
  const base = 20;
  const max = 60;
  if (maxCommits === 0) return base;
  return base + ((commitCount / maxCommits) * (max - base));
}

export function getNodeGlow(commitCount: number, maxCommits: number): string {
  const ratio = maxCommits > 0 ? commitCount / maxCommits : 0;
  if (ratio > 0.7) return "#f43f5e"; // hot rose/magenta
  if (ratio > 0.4) return "#a855f7"; // warm purple
  if (ratio > 0.1) return "#06b6d4"; // cool cyan
  return "#334155"; // dim slate
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
