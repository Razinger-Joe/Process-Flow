'use client';

import { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Terminal,
} from 'lucide-react';
import type { LogLine } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// ============================================================
// Level metadata: icon + color
// ============================================================
const levelMeta: Record<
  LogLine['level'],
  { icon: React.ReactNode; textClass: string; badgeClass: string }
> = {
  info: {
    icon: <Info className="size-3.5 shrink-0" />,
    textClass: 'text-foreground',
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
  success: {
    icon: <CheckCircle2 className="size-3.5 shrink-0" />,
    textClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  error: {
    icon: <XCircle className="size-3.5 shrink-0" />,
    textClass: 'text-red-400',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  warning: {
    icon: <AlertTriangle className="size-3.5 shrink-0" />,
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
};

// ============================================================
// Format timestamp to HH:MM:SS.mmm
// ============================================================
function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  } catch {
    return iso;
  }
}

// ============================================================
// Single log entry row
// ============================================================
function LogEntry({ log }: { log: LogLine }) {
  const meta = levelMeta[log.level];

  return (
    <div
      className={cn(
        'flex items-start gap-2 border-b border-border/50 px-3 py-1.5 text-xs transition-colors hover:bg-muted/30',
        meta.textClass
      )}
    >
      {/* Timestamp */}
      <span className="shrink-0 font-mono text-muted-foreground/80">
        {formatTimestamp(log.timestamp)}
      </span>

      {/* Node name badge */}
      <Badge
        variant="outline"
        className={cn(
          'shrink-0 gap-0.5 border px-1.5 py-0 text-[10px] font-medium leading-4',
          meta.badgeClass
        )}
      >
        {log.nodeName}
      </Badge>

      {/* Level icon */}
      <span className="mt-px shrink-0">{meta.icon}</span>

      {/* Message */}
      <span className="min-w-0 break-words">{log.message}</span>
    </div>
  );
}

// ============================================================
// ExecutionLog — main export
// ============================================================
export default function ExecutionLog({ logs }: { logs: LogLine[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest log
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length]);

  if (logs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50">
          <Terminal className="size-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          Run a workflow to see execution logs here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {logs.map((log) => (
          <LogEntry key={log.id} log={log} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
