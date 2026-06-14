'use client';

import { Workflow as WorkflowIcon, Plus } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowCard } from '@/components/dashboard/WorkflowCard';
import type { Workflow } from '@/types/workflow';

// ============================================================
// Skeleton loading card
// ============================================================
function SkeletonCard() {
  return (
    <Card className="border-l-4 border-l-violet-500/30">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-2">
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-auto flex gap-2 pt-1">
          <div className="h-7 flex-1 animate-pulse rounded-lg bg-muted" />
          <div className="h-7 flex-1 animate-pulse rounded-lg bg-violet-500/10" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Empty state
// ============================================================
function EmptyState() {
  return (
    <div className="col-span-full flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 dark:bg-violet-500/15 dark:text-violet-400">
        <WorkflowIcon className="size-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">
          No workflows yet
        </h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Create your first automation to get started with ProcessFlow Studio.
        </p>
      </div>
      <Button className="mt-2 bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500">
        <Plus className="size-4" />
        New Workflow
      </Button>
    </div>
  );
}

// ============================================================
// WorkflowGrid component
// ============================================================
interface WorkflowGridProps {
  workflows: Workflow[];
  isLoading?: boolean;
}

export function WorkflowGrid({ workflows, isLoading = false }: WorkflowGridProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (workflows.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <EmptyState />
      </div>
    );
  }

  // Workflow grid
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
}
