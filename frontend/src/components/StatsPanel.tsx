"use client";
import { RepoGraph, FileNode } from "@/types/graph";
import { getLangColor, formatBytes } from "@/lib/utils";

interface Props {
  graph: RepoGraph;
  selectedNode: string | null;
  onSelectNode: (id: string | null) => void;
}

export default function StatsPanel({ graph, selectedNode, onSelectNode }: Props) {
  const selected = selectedNode ? graph.nodes.find(n => n.id === selectedNode) : null;
  const connectedEdges = selectedNode
    ? graph.edges.filter(e => e.source === selectedNode || e.target === selectedNode)
    : [];
  const imports = connectedEdges.filter(e => e.source === selectedNode).map(e => e.target);
  const importedBy = connectedEdges.filter(e => e.target === selectedNode).map(e => e.source);

  const totalLines = graph.nodes.reduce((s, n) => s + n.lines, 0);
  const hotFiles = [...graph.nodes].sort((a, b) => b.commit_count - a.commit_count).slice(0, 8);

  return (
    <div className="w-64 flex-shrink-0 flex flex-col overflow-y-auto border-l"
      style={{ background: "#0a0f1e", borderColor: "#1a2040" }}>

      {/* Selected node detail */}
      {selected ? (
        <NodeDetail
          node={selected}
          imports={imports}
          importedBy={importedBy}
          allNodes={graph.nodes}
          onSelectNode={onSelectNode}
        />
      ) : (
        <RepoOverview graph={graph} totalLines={totalLines} hotFiles={hotFiles} onSelectNode={onSelectNode} />
      )}
    </div>
  );
}

function NodeDetail({ node, imports, importedBy, allNodes, onSelectNode }: {
  node: FileNode;
  imports: string[];
  importedBy: string[];
  allNodes: FileNode[];
  onSelectNode: (id: string) => void;
}) {
  const color = getLangColor(node.language);
  const getLabel = (id: string) => allNodes.find(n => n.id === id)?.label || id.split("/").pop() || id;

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs font-mono text-white font-medium truncate">{node.label}</span>
          </div>
          <p className="text-xs text-atlas-dim font-mono break-all">{node.path}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Language", value: node.language },
          { label: "Commits", value: node.commit_count, hot: node.commit_count > 5 },
          { label: "Lines", value: node.lines.toLocaleString() },
          { label: "Size", value: formatBytes(node.size) },
          { label: "Imports", value: imports.length },
          { label: "Used by", value: importedBy.length },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg p-2" style={{ background: "#050810", border: "1px solid #1a2040" }}>
            <p className="text-xs text-atlas-dim font-mono">{stat.label}</p>
            <p className={`text-sm font-mono font-medium mt-0.5 ${(stat as any).hot ? "text-orange-400" : "text-white"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Commit heat bar */}
      {node.commit_count > 0 && (
        <div>
          <p className="text-xs text-atlas-dim font-mono mb-1">Commit heat</p>
          <div className="h-1.5 rounded-full" style={{ background: "#1a2040" }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, node.commit_count * 10)}%`,
                background: node.commit_count > 8 ? "#f97316" : node.commit_count > 4 ? "#eab308" : "#4f8ef7",
              }} />
          </div>
        </div>
      )}

      {/* Import list */}
      {imports.length > 0 && (
        <FileList title={`Imports (${imports.length})`} ids={imports} getLabel={getLabel} onSelect={onSelectNode} />
      )}
      {importedBy.length > 0 && (
        <FileList title={`Used by (${importedBy.length})`} ids={importedBy} getLabel={getLabel} onSelect={onSelectNode} />
      )}
    </div>
  );
}

function FileList({ title, ids, getLabel, onSelect }: {
  title: string; ids: string[]; getLabel: (id: string) => string; onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-atlas-dim font-mono mb-1">{title}</p>
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
        {ids.slice(0, 10).map(id => (
          <button key={id} onClick={() => onSelect(id)}
            className="text-left text-xs font-mono text-atlas-dim hover:text-atlas-accent truncate px-2 py-1 rounded hover:bg-atlas-surface transition-colors">
            {getLabel(id)}
          </button>
        ))}
      </div>
    </div>
  );
}

function RepoOverview({ graph, totalLines, hotFiles, onSelectNode }: {
  graph: RepoGraph; totalLines: number; hotFiles: FileNode[]; onSelectNode: (id: string) => void;
}) {
  const langs = Object.entries(graph.stats.languages).sort((a, b) => b[1] - a[1]);
  const maxLangCount = langs[0]?.[1] || 1;

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Summary */}
      <div>
        <p className="text-xs text-atlas-dim font-mono uppercase tracking-wider mb-3">Overview</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Files", value: graph.stats.total_files },
            { label: "Edges", value: graph.stats.total_edges },
            { label: "Lines", value: totalLines > 1000 ? `${(totalLines/1000).toFixed(1)}k` : totalLines },
            { label: "Languages", value: langs.length },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: "#050810", border: "1px solid #1a2040" }}>
              <p className="text-sm font-mono font-semibold text-white">{s.value}</p>
              <p className="text-xs text-atlas-dim font-mono">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <p className="text-xs text-atlas-dim font-mono uppercase tracking-wider mb-3">Languages</p>
        <div className="flex flex-col gap-2">
          {langs.slice(0, 6).map(([lang, count]) => (
            <div key={lang}>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-atlas-text flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: getLangColor(lang) }} />
                  {lang}
                </span>
                <span className="text-atlas-dim">{count}</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: "#1a2040" }}>
                <div className="h-full rounded-full" style={{
                  width: `${(count / maxLangCount) * 100}%`,
                  background: getLangColor(lang),
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hot files */}
      <div>
        <p className="text-xs text-atlas-dim font-mono uppercase tracking-wider mb-3">🔥 Hottest Files</p>
        <div className="flex flex-col gap-1">
          {hotFiles.map((node, i) => (
            <button key={node.id} onClick={() => onSelectNode(node.id)}
              className="flex items-center gap-2 text-left px-2 py-1.5 rounded hover:bg-atlas-surface transition-colors group">
              <span className="text-xs text-atlas-dim font-mono w-4">{i + 1}</span>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: node.commit_count > 5 ? "#f97316" : node.commit_count > 2 ? "#eab308" : "#4f8ef7" }} />
              <span className="text-xs font-mono text-atlas-dim group-hover:text-white transition-colors truncate flex-1">
                {node.label}
              </span>
              <span className="text-xs font-mono text-atlas-dim flex-shrink-0">{node.commit_count}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-atlas-dim font-mono text-center mt-2">
        Click any planet to inspect
      </p>
    </div>
  );
}
