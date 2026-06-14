import { create } from 'zustand';
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  NodeStatus,
  LogLine,
} from '@/types/workflow';

// ============================================================
// Store interface — matches the spec exactly
// ============================================================
interface WorkflowStore {
  // Current workflow being edited
  workflow: Workflow | null;
  setWorkflow: (w: Workflow) => void;

  // Selected node in editor
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Run state
  isRunning: boolean;
  runStatus: NodeStatus;
  logs: LogLine[];

  // Actions
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: WorkflowEdge) => void;
  deleteEdge: (id: string) => void;
  startRun: () => void;
  appendLog: (log: LogLine) => void;
  resetRun: () => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

// ============================================================
// Zustand store implementation
// ============================================================
export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // ----- Workflow -----
  workflow: null,
  setWorkflow: (w) => set({ workflow: w }),

  // ----- Selection -----
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  // ----- Run state -----
  isRunning: false,
  runStatus: 'idle' as NodeStatus,
  logs: [],

  // ----- Node CRUD -----
  addNode: (node) =>
    set((state) => {
      if (!state.workflow) return state;
      return {
        workflow: {
          ...state.workflow,
          nodes: [...state.workflow.nodes, node],
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  updateNode: (id, updates) =>
    set((state) => {
      if (!state.workflow) return state;
      return {
        workflow: {
          ...state.workflow,
          nodes: state.workflow.nodes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  deleteNode: (id) =>
    set((state) => {
      if (!state.workflow) return state;
      return {
        workflow: {
          ...state.workflow,
          nodes: state.workflow.nodes.filter((n) => n.id !== id),
          // Also remove any edges connected to this node
          edges: state.workflow.edges.filter(
            (e) => e.source !== id && e.target !== id
          ),
          updatedAt: new Date().toISOString(),
        },
        // Deselect if we just deleted the selected node
        selectedNodeId:
          state.selectedNodeId === id ? null : state.selectedNodeId,
      };
    }),

  // ----- Edge CRUD -----
  addEdge: (edge) =>
    set((state) => {
      if (!state.workflow) return state;
      return {
        workflow: {
          ...state.workflow,
          edges: [...state.workflow.edges, edge],
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  deleteEdge: (id) =>
    set((state) => {
      if (!state.workflow) return state;
      return {
        workflow: {
          ...state.workflow,
          edges: state.workflow.edges.filter((e) => e.id !== id),
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  // ----- Run lifecycle -----
  startRun: () =>
    set({
      isRunning: true,
      runStatus: 'running',
      logs: [],
    }),

  appendLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log],
    })),

  resetRun: () =>
    set((state) => {
      if (!state.workflow) return state;
      return {
        isRunning: false,
        runStatus: 'idle',
        logs: [],
        workflow: {
          ...state.workflow,
          nodes: state.workflow.nodes.map((n) => ({
            ...n,
            status: 'idle' as NodeStatus,
          })),
        },
      };
    }),

  // ----- Theme -----
  theme: 'dark',
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      // Toggle class on <html>
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next === 'dark');
      }
      return { theme: next };
    }),
}));
