'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchRunRecord } from '@/lib/mockData';
import type { RunRecord, LogLine } from '@/types/workflow';
import { cn } from '@/lib/utils';

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

function formatDuration(start: string, end?: string): string {
  if (!end) return 'In progress…';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.id as string;
  const [run, setRun] = useState<RunRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchRunRecord(runId).then((r) => {
      if (mounted) {
        setRun(r);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [runId]);

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
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workflows
          </Link>

          {/* Run header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Run {run.id}
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
                Workflow: {run.workflowId}
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
                    {formatDate(run.startedAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(run.startedAt)}
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
                    {formatDuration(run.startedAt, run.completedAt)}
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
                  <p className="text-sm font-medium">{run.logs.length}</p>
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
                  {run.logs.map((log, index) => {
                    const config = levelConfig[log.level];
                    const Icon = config.icon;

                    return (
                      <div
                        key={log.id}
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
                              {log.nodeName}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className={cn('text-sm', config.color)}>
                            {log.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
