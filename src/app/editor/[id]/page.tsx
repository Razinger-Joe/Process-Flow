'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useWorkflowStore } from '@/store/workflowStore';
import { getWorkflow, updateWorkflow } from '@/lib/api/workflows';
import { triggerRun, streamRunLogs } from '@/lib/api/runs';
import type { Workflow, NodeStatus } from '@/types/workflow';
import { toast } from '@/components/ui/toaster';

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
  const setIsRunning = useWorkflowStore((s) => s.setIsRunning);
  const setRunStatus = useWorkflowStore((s) => s.setRunStatus);
  const startRun = useWorkflowStore((s) => s.startRun);
  const appendLog = useWorkflowStore((s) => s.appendLog);
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const resetRun = useWorkflowStore((s) => s.resetRun);
  const setIsSaving = useWorkflowStore((s) => s.setIsSaving);
  const setLastSavedAt = useWorkflowStore((s) => s.setLastSavedAt);

  const cancelRef = useRef<(() => void) | null>(null);
  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to map backend database response to frontend store structure
  const mapBackendToFrontend = useCallback((backendWf: any): Workflow => {
    return {
      id: backendWf.id,
      name: backendWf.name,
      description: backendWf.description || '',
      nodes: backendWf.definition?.nodes || [],
      edges: backendWf.definition?.edges || [],
      createdAt: backendWf.created_at,
      updatedAt: backendWf.updated_at,
      lastRunAt: backendWf.last_run_at || undefined,
      lastRunStatus: (backendWf.last_run_status as NodeStatus) || 'idle',
    };
  }, []);

  const getNodeLabel = useCallback((nodeId?: string | null) => {
    if (!nodeId || nodeId === 'system') return 'System';
    const node = workflow?.nodes?.find((n: any) => n.id === nodeId);
    return node?.label || nodeId;
  }, [workflow?.nodes]);

  // Load workflow on mount
  useEffect(() => {
    let mounted = true;
    hasLoadedRef.current = false;

    getWorkflow(workflowId)
      .then((wf) => {
        if (mounted && wf) {
          const frontendWf = mapBackendToFrontend(wf);
          setWorkflow(frontendWf);
          
          // Allow store update to commit before evaluating auto-saves
          setTimeout(() => {
            if (mounted) {
              hasLoadedRef.current = true;
            }
          }, 150);
        }
      })
      .catch((err: any) => {
        console.error('Error fetching workflow:', err);
        toast.error(`Failed to load workflow definition: ${err?.message || err}`);
      });

    return () => {
      mounted = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workflowId, setWorkflow, mapBackendToFrontend]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!workflow || !hasLoadedRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateWorkflow(workflow.id, {
          name: workflow.name,
          description: workflow.description,
          definition: {
            nodes: workflow.nodes,
            edges: workflow.edges,
          },
        });
        setLastSavedAt(new Date().toISOString());
      } catch (err) {
        console.error('Auto-save error:', err);
        toast.error('Auto-save failed. Check backend connection.');
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1-second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    workflow?.name, 
    workflow?.description, 
    workflow?.nodes, 
    workflow?.edges, 
    workflow?.id, 
    setIsSaving, 
    setLastSavedAt
  ]);

  // Cleanup runs on unmount
  useEffect(() => {
    return () => {
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, []);

  // Handle run trigger
  const handleRun = useCallback(() => {
    if (!workflow || isRunning) return;

    resetRun();

    setTimeout(async () => {
      try {
        startRun();
        
        // 1. Request engine execution run
        const runRecord = await triggerRun(workflowId);
        toast.info('Execution triggered. Streaming logs...', 'Run Started');
        
        // 2. Open Server-Sent Events stream for real-time logs
        const disconnect = streamRunLogs(
          runRecord.id,
          (logLine) => {
            // Map backend logLine to frontend LogLine format expected by appendLog
            const mappedLogLine = {
              ...logLine,
              nodeName: getNodeLabel(logLine.nodeId),
              nodeId: logLine.nodeId || 'system',
              level: logLine.level as any,
            };
            appendLog(mappedLogLine);
            
            // Map logs to update local canvas node status indicators
            if (logLine.nodeId && logLine.nodeId !== 'system') {
              let status: NodeStatus = 'running';
              if (logLine.level === 'success') {
                status = 'success';
              } else if (logLine.level === 'error') {
                status = 'error';
              }
              updateNode(logLine.nodeId, { status });
            }
          },
          (finalStatus) => {
            setIsRunning(false);
            setRunStatus(finalStatus as NodeStatus);
            if (finalStatus === 'success') {
              toast.success('Workflow run completed successfully!', 'Success');
            } else {
              toast.error('Workflow run aborted with errors.', 'Execution Failed');
            }
          },
          (error) => {
            console.error('SSE Error:', error);
            setIsRunning(false);
            setRunStatus('error');
            toast.error('Connection to log stream lost.', 'Stream Error');
          }
        );

        cancelRef.current = disconnect;
      } catch (err: any) {
        console.error('Failed to trigger run:', err);
        const detail = err.response?.data?.detail || 'Could not connect to celery backend.';
        toast.error(detail, 'Execution Failed');
        setIsRunning(false);
        setRunStatus('error');
      }
    }, 100);
  }, [workflow, isRunning, workflowId, resetRun, startRun, appendLog, updateNode, setIsRunning, setRunStatus]);

  // Manual save backup
  const handleSave = useCallback(async () => {
    if (!workflow) return;
    setIsSaving(true);
    try {
      await updateWorkflow(workflow.id, {
        name: workflow.name,
        description: workflow.description,
        definition: {
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
      });
      setLastSavedAt(new Date().toISOString());
      toast.success('Workflow saved successfully!', 'Saved');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save workflow.');
    } finally {
      setIsSaving(false);
    }
  }, [workflow, setIsSaving, setLastSavedAt]);

  // Rename callback
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
          <p className="text-sm text-muted-foreground">Hydrating workflow definition…</p>
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
