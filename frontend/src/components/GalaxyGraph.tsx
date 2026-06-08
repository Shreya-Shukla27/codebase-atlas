"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from "d3-force";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { RepoGraph, FileNode } from "@/types/graph";
import { getLangColor, getNodeSize, getNodeGlow } from "@/lib/utils";

type ViewMode = "imports" | "heatmap" | "language";

interface Props {
  graph: RepoGraph;
  viewMode: ViewMode;
  selectedNode: string | null;
  onSelectNode: (id: string | null) => void;
  animationDuration?: number;
}

export const DEFAULT_ANIMATION_DURATION = 700;

function computeLayout(nodes: FileNode[], edges: Array<{ source: string; target: string }>, maxCommits: number) {
  const positions: Record<string, { x: number; y: number }> = {};
  if (!nodes || nodes.length === 0) return positions;

  const simNodes = nodes.map(n => ({ id: n.id, radius: Math.max(8, getNodeSize(n.commit_count || 0, maxCommits)) }));
  const degree: Record<string, number> = {};
  edges.forEach(e => {
    degree[e.source] = (degree[e.source] || 0) + 1;
    degree[e.target] = (degree[e.target] || 0) + 1;
  });

  const simLinks = edges.map(e => ({
    source: e.source,
    target: e.target,
    distance: Math.max(60, 220 - ((degree[e.source] || 0) + (degree[e.target] || 0)) * 12)
  }));

  const sim = forceSimulation(simNodes as any)
    .force("charge", forceManyBody().strength(-80))
    .force("link", forceLink(simLinks).id((d: any) => d.id).distance((d: any) => d.distance).strength(0.8))
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide((d: any) => d.radius + 8).strength(0.9))
    .stop();

  const ticks = Math.min(1200, Math.max(300, simNodes.length * 12));
  for (let i = 0; i < ticks; i++) sim.tick();
  simNodes.forEach((n: any) => { positions[n.id] = { x: n.x || 0, y: n.y || 0 }; });
  sim.stop();
  return positions;
}

function PlanetNode({ data }: NodeProps) {
  const { node, size, color, glow, selected, viewMode } = data as any;
  const isHot = node.commit_count > 0 && viewMode === "heatmap";
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {isHot && <div style={{ position: "absolute", width: size + 16, height: size + 16, borderRadius: "50%", background: `radial-gradient(circle, ${glow}22, transparent 70%)`, pointerEvents: "none" }} />}
      {selected && <div style={{ position: "absolute", width: size + 8, height: size + 8, borderRadius: "50%", border: "2px solid #fff", opacity: 0.6, pointerEvents: "none" }} />}
      <div style={{ width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}88)`, boxShadow: isHot ? `0 0 ${size / 2}px ${glow}66` : `0 0 8px ${color}33`, cursor: "pointer", transition: "transform 0.25s ease", transform: selected ? "scale(1.08)" : "scale(1)", border: selected ? `1px solid ${color}` : "none" }} />
      {size > 22 && <div style={{ position: "absolute", top: size + 4, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 10, color: selected ? "#fff" : "#64748b", fontFamily: "'JetBrains Mono', monospace", pointerEvents: "none", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{node.label}</div>}
    </div>
  );
}

const nodeTypes = { planet: PlanetNode };

export default function GalaxyGraph({ graph, viewMode, selectedNode, onSelectNode, animationDuration = DEFAULT_ANIMATION_DURATION }: Props) {
  const maxCommits = graph.stats.max_commits || 1;
  const [layouting, setLayouting] = useState(false);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const shouldShow = graph.nodes.length > 40;
    if (shouldShow) setLayouting(true);
    const timer = setTimeout(() => {
      try {
        const p = computeLayout(graph.nodes, graph.edges, maxCommits);
        setPositions(p);
      } finally {
        if (shouldShow) setLayouting(false);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [graph.nodes, graph.edges, maxCommits]);

  const rfNodes: Node[] = useMemo(() =>
    graph.nodes.map(node => {
      const pos = positions[node.id] || { x: 0, y: 0 };
      const size = getNodeSize(node.commit_count, maxCommits);
      const color = viewMode === "language" ? getLangColor(node.language) : viewMode === "heatmap" ? getNodeGlow(node.commit_count, maxCommits) : "#4f8ef7";
      const glow = getNodeGlow(node.commit_count, maxCommits);
      return { id: node.id, type: "planet", position: pos, data: { node, size, color, glow, selected: selectedNode === node.id, viewMode }, style: { background: "transparent", border: "none" } } as any;
    }),
    [graph.nodes, positions, viewMode, selectedNode, maxCommits]
  );

  const rfEdges: Edge[] = useMemo(() =>
    viewMode === "imports" ? graph.edges.map(e => ({ id: e.id, source: e.source, target: e.target, style: { stroke: "#1e3a5f", strokeWidth: 1, opacity: 0.6 }, animated: false })) : [],
    [graph.edges, viewMode]
  ) as any;

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => {
    if (!setNodes || isDraggingRef.current) return;
    const targetMap: Record<string, { x: number; y: number }> = {};
    rfNodes.forEach(n => { targetMap[n.id] = { x: n.position?.x ?? 0, y: n.position?.y ?? 0 }; });
    if (!nodes || nodes.length === 0) { setNodes(rfNodes); return; }
    const startMap: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => { startMap[n.id] = { x: n.position?.x ?? 0, y: n.position?.y ?? 0 }; });
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / animationDuration);
      const eased = easeOutCubic(t);
      const updated = nodes.map(n => {
        const target = targetMap[n.id];
        const startPos = startMap[n.id] || { x: 0, y: 0 };
        if (!target) return n;
        return { ...n, position: { x: startPos.x + (target.x - startPos.x) * eased, y: startPos.y + (target.y - startPos.y) * eased } };
      });
      setNodes(updated);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else rafRef.current = null;
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfNodes, animationDuration]);

  const onNodeDragStart = useCallback(() => { isDraggingRef.current = true; if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  const onNodeDragStop = useCallback(() => { isDraggingRef.current = false; }, []);
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => { onSelectNode(selectedNode === node.id ? null : node.id); }, [selectedNode, onSelectNode]);
  const onPaneClick = useCallback(() => onSelectNode(null), [onSelectNode]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {layouting && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,8,16,0.8)", color: "#cfe9ff", fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Arranging galaxy...</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>This may take a moment for large repos</div>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} color="#1a2040" gap={32} size={1} />
        <Controls />
        <MiniMap nodeColor={n => (n.data as any)?.color || "#1a2040"} maskColor="rgba(5,8,16,0.8)" style={{ background: "#0a0f1e" }} />
      </ReactFlow>
    </div>
  );
}