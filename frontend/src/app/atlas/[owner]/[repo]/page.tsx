"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { RepoGraph, ChatMessage } from "@/types/graph";
import { fetchRepoGraph, streamChat } from "@/lib/api";
import StatsPanel from "@/components/StatsPanel";
import ChatPanel from "@/components/ChatPanel";
import TopBar from "@/components/TopBar";

const GalaxyGraph = dynamic(() => import("@/components/GalaxyGraph"), { ssr: false });

type ViewMode = "imports" | "heatmap" | "language";

export default function AtlasPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [graph, setGraph] = useState<RepoGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchRepoGraph(owner, repo)
      .then(setGraph)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const buildRepoContext = useCallback(() => {
    if (!graph) return "";
    const topFiles = [...graph.nodes]
      .sort((a, b) => b.commit_count - a.commit_count)
      .slice(0, 20)
      .map(n => `${n.path} (${n.language}, ${n.commit_count} commits, ${n.lines} lines)`)
      .join("\n");
    const edgeSample = graph.edges.slice(0, 30)
      .map(e => `${e.source} → ${e.target}`)
      .join("\n");
    return `Repo: ${graph.repo}
Total files: ${graph.stats.total_files}
Languages: ${Object.entries(graph.stats.languages).map(([k,v]) => `${k}(${v})`).join(", ")}
Total import edges: ${graph.stats.total_edges}

Top files by commits:
${topFiles}

Import edges (sample):
${edgeSample}`;
  }, [graph]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatLoading(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      for await (const chunk of streamChat(apiMessages, buildRepoContext())) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Error getting response. Check your API key.";
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return <LoadingScreen repo={`${owner}/${repo}`} />;
  if (error) return <ErrorScreen error={error} />;
  if (!graph) return null;

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden" style={{ background: "#050810" }}>
      <TopBar
        repo={`${owner}/${repo}`}
        stats={graph.stats}
        viewMode={viewMode}
        setViewMode={setViewMode}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Graph canvas */}
        <div className="flex-1 relative">
          <GalaxyGraph
            graph={graph}
            viewMode={viewMode}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />
        </div>

        {/* Stats sidebar */}
        <StatsPanel
          graph={graph}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
        />

        {/* Chat panel */}
        {chatOpen && (
          <ChatPanel
            messages={messages}
            loading={chatLoading}
            onSend={sendMessage}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ repo }: { repo: string }) {
  const steps = ["Fetching tree...", "Counting commits...", "Building graph..."];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx(i => (i + 1) % steps.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-6" style={{ background: "#050810" }}>
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500 opacity-30 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-blue-400 animate-spin" />
        <div className="absolute inset-4 rounded-full bg-blue-500 opacity-60" />
      </div>
      <div className="text-center">
        <p className="text-white font-mono text-sm">Mapping {repo}</p>
        <p className="text-atlas-dim text-xs mt-1 font-mono">{steps[idx]}</p>
      </div>
      <div className="flex gap-1 mt-2">
        {steps.map((s, i) => (
          <div key={i} className="px-2 py-1 rounded-full text-xs font-mono"
            style={{ background: i === idx ? '#0b1226' : 'transparent', border: '1px solid #11243a', color: i === idx ? '#cfe9ff' : '#5b6f88' }}>
            {s.replace('...', '')}
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#050810" }}>
      <div className="text-red-400 text-4xl">⚠</div>
      <p className="text-white font-mono">Failed to load repo</p>
      <p className="text-atlas-dim text-sm font-mono max-w-md text-center">{error}</p>
      <button onClick={() => window.history.back()}
        className="mt-4 px-5 py-2 border border-atlas-border rounded-lg text-sm text-atlas-dim hover:text-white hover:border-atlas-accent transition-colors font-mono">
        ← Go back
      </button>
    </div>
  );
}
