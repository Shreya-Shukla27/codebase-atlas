export interface FileNode {
  id: string;
  label: string;
  path: string;
  extension: string;
  size: number;
  commit_count: number;
  lines: number;
  node_type: string;
  language: string;
}

export interface ImportEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface RepoGraph {
  repo: string;
  nodes: FileNode[];
  edges: ImportEdge[];
  stats: {
    total_files: number;
    total_edges: number;
    languages: Record<string, number>;
    most_changed: Array<{ file: string; path: string; count: number }>;
    max_commits: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
