"use client";
import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/types/graph";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (content: string) => void;
  onClose: () => void;
}

const SUGGESTIONS = [
  "What are the most critical files in this repo?",
  "Which files have the most dependencies?",
  "Explain the overall architecture",
  "What language is most used and why?",
  "Which files are the riskiest to change?",
];

export default function ChatPanel({ messages, loading, onSend, onClose }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  }

  return (
    <div className="w-80 flex flex-col border-l" style={{ background: "#0a0f1e", borderColor: "#1a2040" }}>
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b" style={{ borderColor: "#1a2040" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-sm font-mono text-white">Atlas AI</span>
        </div>
        <button onClick={onClose} className="text-atlas-dim hover:text-white transition-colors text-lg leading-none">×</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-atlas-dim font-mono text-center mt-4">
              Ask anything about this codebase
            </p>
            <div className="flex flex-col gap-1.5 mt-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => onSend(s)}
                  className="text-left text-xs font-mono text-atlas-dim hover:text-white border rounded-lg px-3 py-2 hover:border-atlas-accent transition-all"
                  style={{ borderColor: "#1a2040" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
        )}
        {loading && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
          <ThinkingIndicator />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: "#1a2040" }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about the codebase..."
            disabled={loading}
            className="flex-1 bg-atlas-surface border rounded-lg px-3 py-2 text-xs text-atlas-text placeholder-atlas-dim focus:outline-none focus:border-atlas-accent transition-colors font-mono disabled:opacity-50"
            style={{ borderColor: "#1a2040" }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-atlas-accent text-white rounded-lg text-xs font-mono hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  // Simple markdown rendering
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let inCode = false;
    let codeLines: string[] = [];
    let key = 0;

    for (const line of lines) {
      if (line.startsWith("```")) {
        if (inCode) {
          elements.push(
            <pre key={key++} style={{ background: "#050810", border: "1px solid #1a2040", borderRadius: 6, padding: "8px 10px", fontSize: 11, overflowX: "auto", fontFamily: "'Fira Code', monospace", margin: "6px 0" }}>
              {codeLines.join("\n")}
            </pre>
          );
          codeLines = [];
          inCode = false;
        } else {
          inCode = true;
        }
      } else if (inCode) {
        codeLines.push(line);
      } else {
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/`(.*?)`/g, `<code style="background:#1a2040;padding:1px 5px;border-radius:3px;font-family:'Fira Code',monospace;font-size:11px;color:#4f8ef7">$1</code>`);
        elements.push(
          <p key={key++} style={{ margin: "2px 0", lineHeight: 1.6, fontSize: 12 }}
            dangerouslySetInnerHTML={{ __html: formatted || "&nbsp;" }} />
        );
      }
    }
    return elements;
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-full rounded-lg px-3 py-2 text-xs font-mono ${isUser ? "text-white" : "text-atlas-text"}`}
        style={{
          background: isUser ? "#4f8ef7" : "#050810",
          border: isUser ? "none" : "1px solid #1a2040",
          maxWidth: "90%",
        }}
      >
        {isUser ? (
          <p style={{ margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
        ) : (
          renderContent(msg.content)
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-lg px-4 py-3 flex items-center gap-1.5"
        style={{ background: "#050810", border: "1px solid #1a2040" }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-atlas-dim animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
