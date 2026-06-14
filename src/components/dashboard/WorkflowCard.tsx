'use client';

import Link from 'next/link';
import { Play, Pencil, Clock, Box } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Workflow, NodeStatus } from '@/types/workflow';

// ============================================================
// Status styling map
// ============================================================
const statusStyles: Record<
  NodeStatus,
  { label: string; className: string }
> = {
  idle: {
    label: 'Idle',
    className: 'bg-zinc-500/15 text-zinc-400 dark:bg-zinc-500/20 dark:text-zinc-400',
  },
  running: {
    label: 'Running',
    className: 'bg-amber-500/15 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse',
  },
  success: {
    label: 'Success',
    className: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  error: {
    label: 'Error',
    className: 'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  },
};

// ============================================================
// Relative time helper
// ============================================================
function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// ============================================================
// WorkflowCard component
// ============================================================
interface WorkflowCardProps {
  workflow: Workflow;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const status = workflow.lastRunStatus ?? 'idle';
  const statusInfo = statusStyles[status];

  return (
    <Card
      className={cn(
        'relative border-l-4 border-l-violet-500 transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5',
        'hover:ring-violet-500/30 dark:hover:ring-violet-400/20'
      )}
    >
      <CardHeader className="relative pb-0">
        {/* Status badge — top right */}
        <div className="absolute top-0 right-0">
          <Badge
            className={cn(
              'rounded-md border-0 text-[10px] font-semibold uppercase tracking-wider',
              statusInfo.className
            )}
          >
            {statusInfo.label}
          </Badge>
        </div>

        {/* Workflow name */}
        <h3 className="pr-16 text-sm font-bold leading-snug text-foreground">
          {workflow.name}
        </h3>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-1">
        {/* Description — truncated to 2 lines */}
        {workflow.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {workflow.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Box className="size-3" />
            {workflow.nodes.length} node{workflow.nodes.length !== 1 ? 's' : ''}
          </span>
          {workflow.lastRunAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatRelativeTime(workflow.lastRunAt)}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Link href={`/editor/${workflow.id}`}>
            <Button variant="outline" size="sm" className="flex-1 w-full">
              <Pencil className="size-3" />
              Edit
            </Button>
          </Link>
          <Button
            size="sm"
            className="flex-1 bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            <Play className="size-3" />
            Run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
