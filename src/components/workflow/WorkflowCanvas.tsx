'use client';

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/store/workflowStore';
import { TriggerNode } from '@/components/nodes/TriggerNode';
import { ActionNode } from '@/components/nodes/ActionNode';
import { LogicNode } from '@/components/nodes/LogicNode';
import { OutputNode } from '@/components/nodes/OutputNode';
import type { NodeType, NodeStatus } from '@/types/workflow';

// ============================================================
// Custom node type registry (memoized at module level)
// ============================================================
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  output: OutputNode,
};

// ============================================================
// Edge color per source node type
// ============================================================
const typeEdgeColor: Record<NodeType, string> = {
  trigger: '#f59e0b', // amber-500
  action: '#8b5cf6',  // violet-500
  logic: '#3b82f6',   // blue-500
  output: '#10b981',  // emerald-500
};

// ============================================================
// Inner canvas (needs ReactFlowProvider as parent)
// ============================================================
function WorkflowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // ----- Store subscriptions -----
  const workflow = useWorkflowStore((s) => s.workflow);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const addNode = useWorkflowStore((s) => s.addNode);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const updateNode = useWorkflowStore((s) => s.updateNode);

  // Local state for React Flow internal position/size changes
  const [localNodes, setLocalNodes] = useState<Node[]>([]);
  const [localEdges, setLocalEdges] = useState<Edge[]>([]);

  // ----- Convert store → React Flow format -----
  const rfNodes: Node[] = useMemo(() => {
    if (!workflow) return [];
    return workflow.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      selected: n.id === selectedNodeId,
      data: {
        label: n.label,
        type: n.type,
        status: n.status,
        description: n.description,
      },
    }));
  }, [workflow, selectedNodeId]);

  const rfEdges: Edge[] = useMemo(() => {
    if (!workflow) return [];

    // Build a quick lookup from node id → type for coloring edges
    const nodeTypeMap = new Map(workflow.nodes.map((n) => [n.id, n]));

    return workflow.edges.map((e) => {
      const sourceNode = nodeTypeMap.get(e.source);
      const strokeColor = sourceNode
        ? typeEdgeColor[sourceNode.type]
        : '#6b7280';
      const isRunning = sourceNode?.status === 'running';

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: isRunning,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: strokeColor,
        },
        style: {
          stroke: strokeColor,
          strokeWidth: 2,
        },
        labelStyle: {
          fontSize: 11,
          fontWeight: 500,
          fill: '#a1a1aa',
        },
        labelBgStyle: {
          fill: 'hsl(var(--card))',
          fillOpacity: 0.9,
        },
      };
    });
  }, [workflow]);

  // ----- Handlers -----
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // Apply visual changes (dragging, selecting) locally
      const updated = applyNodeChanges(changes, rfNodes);
      setLocalNodes(updated);

      // Persist position changes back to the store
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateNode(change.id, { position: change.position });
        }
        if (change.type === 'select' && change.selected) {
          setSelectedNodeId(change.id);
        }
      }
    },
    [rfNodes, updateNode, setSelectedNodeId]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const updated = applyEdgeChanges(changes, rfEdges);
      setLocalEdges(updated);
    },
    [rfEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const newEdge = {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
      };
      addEdge(newEdge);
    },
    [addEdge]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // ----- Drag & drop from NodePalette -----
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/processflow-type') as NodeType;
      const label = event.dataTransfer.getData('application/processflow-label');

      if (!type || !label) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node-${Date.now()}`,
        type,
        label,
        description: '',
        position,
        config: {},
        status: 'idle' as NodeStatus,
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  // ----- Empty state -----
  const isEmpty = !workflow || workflow.nodes.length === 0;

  return (
    <div ref={reactFlowWrapper} className="relative flex-1 h-full">
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/50 bg-card/30 px-12 py-10 backdrop-blur-sm">
            <GripVertical className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground/60">
              Drag a trigger node to get started
            </p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        className="!bg-background"
      >
        <Background
          gap={20}
          size={1}
          color="hsl(var(--muted-foreground) / 0.12)"
        />
        <Controls
          position="bottom-left"
          className={cn(
            '[&>button]:!rounded-md [&>button]:!border-border/50 [&>button]:!bg-card [&>button]:!text-foreground',
            '[&>button]:!shadow-sm [&>button:hover]:!bg-muted'
          )}
        />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              trigger: '#f59e0b',
              action: '#8b5cf6',
              logic: '#3b82f6',
              output: '#10b981',
            };
            return colors[node.type ?? ''] ?? '#6b7280';
          }}
          maskColor="hsl(var(--background) / 0.7)"
          className="!rounded-lg !border !border-border/50 !bg-card/80 !shadow-lg"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

// ============================================================
// Exported wrapper with ReactFlowProvider
// ============================================================
export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}

export default WorkflowCanvas;
