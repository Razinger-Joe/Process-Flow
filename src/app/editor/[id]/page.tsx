'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useWorkflowStore } from '@/store/workflowStore';
import { fetchWorkflow, runWorkflow } from '@/lib/mockData';
import type { NodeStatus } from '@/types/workflow';

import { Navbar } from '@/components/layout/Navbar';
import { NodePalette } from '@/components/workflow/NodePalette';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BottomPanel } from '@/components/layout/BottomPanel';
import { Loader2 } from 'lucide-react';

export default function EditorPage() {
  const params = useParams();
  const workflowId = params.id as string;

  const workflow = useWorkflowStore((s) => s.workflow);
  const setWorkflow = useWorkflowStore((s) => s.setWorkflow);
  const isRunning = useWorkflowStore((s) => s.isRunning);
  const startRun = useWorkflowStore((s) => s.startRun);
  const appendLog = useWorkflowStore((s) => s.appendLog);
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const resetRun = useWorkflowStore((s) => s.resetRun);

  const cancelRef = useRef<(() => void) | null>(null);

  // Load workflow on mount
  useEffect(() => {
    let mounted = true;
    fetchWorkflow(workflowId).then((wf) => {
      if (mounted && wf) {
        setWorkflow(wf);
      }
    });
    return () => {
      mounted = false;
    };
  }, [workflowId, setWorkflow]);

  // Cleanup run on unmount
  useEffect(() => {
    return () => {
      cancelRef.current?.();
    };
  }, []);

  // Handle run workflow
  const handleRun = useCallback(() => {
    if (!workflow || isRunning) return;

    // Reset all node statuses first
    resetRun();

    // Small delay to let the reset render, then start
    setTimeout(() => {
      startRun();

      const currentWorkflow = useWorkflowStore.getState().workflow;
      if (!currentWorkflow) return;

      const { cancel } = runWorkflow(currentWorkflow, {
        onNodeStatusChange: (nodeId: string, status: NodeStatus) => {
          updateNode(nodeId, { status });
        },
        onLog: (log) => {
          appendLog(log);
        },
        onComplete: (status: NodeStatus) => {
          useWorkflowStore.setState({
            isRunning: false,
            runStatus: status,
          });
          // Update workflow's last run info
          const wf = useWorkflowStore.getState().workflow;
          if (wf) {
            useWorkflowStore.setState({
              workflow: {
                ...wf,
                lastRunAt: new Date().toISOString(),
                lastRunStatus: status,
              },
            });
          }
        },
      });

      cancelRef.current = cancel;
    }, 100);
  }, [workflow, isRunning, resetRun, startRun, updateNode, appendLog]);

  // Handle save workflow
  const handleSave = useCallback(() => {
    if (!workflow) return;
    // Mock save — just update the timestamp
    setWorkflow({
      ...workflow,
      updatedAt: new Date().toISOString(),
    });
  }, [workflow, setWorkflow]);

  // Handle workflow rename
  const handleRename = useCallback(
    (newName: string) => {
      if (!workflow) return;
      setWorkflow({ ...workflow, name: newName });
    },
    [workflow, setWorkflow]
  );

  // Loading state
  if (!workflow) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading workflow…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Navbar */}
      <Navbar
        isEditor
        workflowName={workflow.name}
        onRun={handleRun}
        onSave={handleSave}
        onRename={handleRename}
      />

      {/* Main content area: sidebar | canvas | config panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Node Palette */}
        <NodePalette />

        {/* Center — Canvas + Bottom Panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* React Flow Canvas */}
          <WorkflowCanvas />

          {/* Bottom Panel — Execution Log */}
          <BottomPanel />
        </div>

        {/* Right Sidebar — Node Config */}
        <RightSidebar />
      </div>
    </div>
  );
}
