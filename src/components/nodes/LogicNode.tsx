'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch, Shuffle, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NodeType, NodeStatus } from '@/types/workflow';

// ============================================================
// Data shape
// ============================================================
export interface LogicNodeData {
  label: string;
  type: NodeType;
  status: NodeStatus;
  description?: string;
}

// ============================================================
// Icon resolver
// ============================================================
function getLogicIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('transform') || lower.includes('shuffle') || lower.includes('data'))
    return Shuffle;
  if (lower.includes('loop') || lower.includes('repeat') || lower.includes('iterate'))
    return Repeat;
  return GitBranch;
}

// ============================================================
// Status dot component
// ============================================================
function StatusDot({ status }: { status: NodeStatus }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        className={cn(
          'inline-block h-2 w-2 rounded-full',
          status === 'idle' && 'bg-gray-400',
          status === 'running' && 'bg-blue-400 animate-pulse',
          status === 'success' && 'bg-emerald-400',
          status === 'error' && 'bg-red-400'
        )}
      />
      {status}
    </span>
  );
}

// ============================================================
// LogicNode component
// ============================================================
function LogicNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as LogicNodeData;
  const Icon = getLogicIcon(nodeData.label);

  return (
    <div
      className={cn(
        'relative min-w-[180px] rounded-lg border border-border/60 bg-card px-3.5 py-3 shadow-md transition-all duration-200',
        'border-l-[4px] border-l-blue-500',
        selected && 'ring-2 ring-violet-500 ring-offset-1 ring-offset-background scale-[1.02]',
        nodeData.status === 'running' && 'shadow-blue-500/25 shadow-lg',
        nodeData.status === 'success' && 'shadow-emerald-500/20 shadow-lg',
        nodeData.status === 'error' && 'shadow-red-500/20 shadow-lg'
      )}
    >
      {/* Target handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-blue-500 !bg-background"
      />

      {/* Top row: Icon + category label */}
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500/70">
          Logic
        </span>
      </div>

      {/* Node name */}
      <p className="text-sm font-bold leading-tight text-foreground">
        {nodeData.label}
      </p>

      {/* Description */}
      {nodeData.description && (
        <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
          {nodeData.description}
        </p>
      )}

      {/* Status dot */}
      <div className="mt-2">
        <StatusDot status={nodeData.status} />
      </div>

      {/* Two source handles on right — true (top) / false (bottom) */}
      <Handle
        type="source"
        id="true"
        position={Position.Right}
        style={{ top: '35%' }}
        className="!h-3 !w-3 !rounded-full !border-2 !border-emerald-500 !bg-background"
      />
      <Handle
        type="source"
        id="false"
        position={Position.Right}
        style={{ top: '65%' }}
        className="!h-3 !w-3 !rounded-full !border-2 !border-red-400 !bg-background"
      />

      {/* Branch labels next to handles */}
      <span className="absolute right-5 text-[9px] font-medium text-emerald-500" style={{ top: 'calc(35% - 5px)' }}>
        T
      </span>
      <span className="absolute right-5 text-[9px] font-medium text-red-400" style={{ top: 'calc(65% - 5px)' }}>
        F
      </span>
    </div>
  );
}

export const LogicNode = memo(LogicNodeComponent);
export default LogicNode;
