'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getRun, RunRecord, LogLine } from '@/lib/api/runs';
import { getWorkflow, Workflow } from '@/lib/api/workflows';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';

import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  Clock,
  Terminal,
  Calendar,
  Timer,
} from 'lucide-react';

const levelConfig: Record<
  LogLine['level'],
  { icon: React.ElementType; color: string; bg: string }
> = {
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  error: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
};

const statusConfig: Record<string, { label: string; variant: string; color: string }> = {
  idle: { label: 'Idle', variant: 'secondary', color: 'bg-zinc-500' },
  running: { label: 'Running', variant: 'secondary', color: 'bg-amber-500' },
  success: { label: 'Success', variant: 'secondary', color: 'bg-emerald-500' },
  error: { label: 'Failed', variant: 'destructive', color: 'bg-red-500' },
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(start: string, end?: string | null): string {
  if (!end) return 'In progress…';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.id as string;
  const [run, setRun] = useState<RunRecord | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const runData = await getRun(runId);
        if (!mounted) return;
        setRun(runData);

        const wfData = await getWorkflow(runData.workflow_id);
        if (mounted) {
          setWorkflow(wfData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading run detail page data:', err);
        toast.error('Failed to load workflow run records.');
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [runId]);

  const getNodeLabel = (nodeId?: string | null) => {
    if (!nodeId || nodeId === 'system') return 'System';
    const node = workflow?.definition?.nodes?.find((n: any) => n.id === nodeId);
    return node?.label || nodeId;
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading run details…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Run not found</h2>
            <p className="text-sm text-muted-foreground">
              The run record you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[run.status] ?? statusConfig.idle;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-6 space-y-6">
          {/* Back link */}
          <Link
            href={workflow ? `/editor/${workflow.id}` : '/'}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to editor
          </Link>

          {/* Run header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Run {run.id.slice(0, 8)}
                </h1>
                <Badge
                  variant={status.variant as 'secondary' | 'destructive'}
                  className="gap-1.5"
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      status.color,
                      run.status === 'running' && 'animate-pulse'
                    )}
                  />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Workflow: <span className="font-semibold text-foreground">{workflow?.name || run.workflow_id}</span>
              </p>
            </div>
          </div>

          {/* Run metadata cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="text-sm font-medium">
                    {formatDate(run.started_at)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatTimestamp(run.started_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <Timer className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">
                    {formatDuration(run.started_at, run.completed_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Terminal className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Log entries</p>
                  <p className="text-sm font-medium">{run.logs?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Execution timeline */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Execution Timeline</h2>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <div className="divide-y divide-border/50">
                  {run.logs && run.logs.length > 0 ? (
                    run.logs.map((log, index) => {
                      const config = levelConfig[log.level] || levelConfig.info;
                      const Icon = config.icon;

                      return (
                        <div
                          key={log.id || index}
                          className="flex items-start gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
                        >
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center pt-1">
                            <div
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-full',
                                config.bg
                              )}
                            >
                              <Icon className={cn('h-3.5 w-3.5', config.color)} />
                            </div>
                            {index < run.logs.length - 1 && (
                              <div className="mt-1 h-full w-px bg-border/50" />
                            )}
                          </div>

                          {/* Log content */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {getNodeLabel(log.nodeId)}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            <p className={cn('text-sm font-mono whitespace-pre-wrap', config.color)}>
                              {log.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No logs recorded for this run.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
