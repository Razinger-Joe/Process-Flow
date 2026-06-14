'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Eraser,
  GripHorizontal,
  Inbox,
  Clock,
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ExecutionLog from '@/components/workflow/ExecutionLog';

// ============================================================
// Constants
// ============================================================
const MIN_HEIGHT = 48;
const MAX_HEIGHT = 500;
const DEFAULT_HEIGHT = 200;

// ============================================================
// BottomPanel — main export
// ============================================================
export function BottomPanel() {
  const logs = useWorkflowStore((s) => s.logs);
  const isRunning = useWorkflowStore((s) => s.isRunning);
  const resetRun = useWorkflowStore((s) => s.resetRun);

  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(DEFAULT_HEIGHT);

  // ---- Resize handlers ----
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) return;
      e.preventDefault();
      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        // Dragging up increases height
        const delta = startY.current - moveEvent.clientY;
        const newHeight = Math.min(
          MAX_HEIGHT,
          Math.max(MIN_HEIGHT, startHeight.current + delta)
        );
        setHeight(newHeight);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [height, isCollapsed]
  );

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const clearLogs = useCallback(() => {
    resetRun();
  }, [resetRun]);

  const panelHeight = isCollapsed ? MIN_HEIGHT : height;

  return (
    <div
      className="relative flex flex-col border-t border-border bg-card"
      style={{ height: panelHeight, minHeight: MIN_HEIGHT }}
    >
      {/* ---- Drag handle ---- */}
      {!isCollapsed && (
        <div
          className="group flex h-2 cursor-row-resize items-center justify-center transition-colors hover:bg-muted/50"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize execution panel"
        >
          <GripHorizontal className="size-4 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
        </div>
      )}

      {/* ---- Header bar ---- */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/50 px-3">
        {/* Left: title + running indicator */}
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            Execution Log
          </span>
          {isRunning && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={clearLogs}
            aria-label="Clear logs"
          >
            <Eraser className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* ---- Tabbed content (hidden when collapsed) ---- */}
      {!isCollapsed && (
        <Tabs defaultValue="logs" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="h-8 shrink-0 bg-transparent border-b border-border/50 px-3">
            <TabsTrigger value="logs" className="text-xs">
              Logs
            </TabsTrigger>
            <TabsTrigger value="io" className="text-xs">
              Input / Output
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="min-h-0 flex-1 overflow-hidden">
            <ExecutionLog logs={logs} />
          </TabsContent>

          <TabsContent value="io" className="min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50">
                <Inbox className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Select a node to view its input/output
              </p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50">
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Previous run history will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
