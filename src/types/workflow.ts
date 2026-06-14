// ============================================================
// ProcessFlow Studio — Core TypeScript Interfaces
// ============================================================

export type NodeType = 'trigger' | 'action' | 'logic' | 'output';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  position: { x: number; y: number };
  config: Record<string, string>;
  status: NodeStatus;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: NodeStatus;
}

export interface LogLine {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeName: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface RunRecord {
  id: string;
  workflowId: string;
  startedAt: string;
  completedAt?: string;
  status: NodeStatus;
  logs: LogLine[];
}

// ============================================================
// Node palette definitions (for the left sidebar)
// ============================================================

export interface PaletteNode {
  type: NodeType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface PaletteCategory {
  label: string;
  type: NodeType;
  color: string; // Tailwind color name
  nodes: PaletteNode[];
}
