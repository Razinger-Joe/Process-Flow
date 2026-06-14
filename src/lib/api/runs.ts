import { supabase } from '../supabase';

export interface LogLine {
  id: string;
  timestamp: string;
  nodeId?: string | null;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface RunRecord {
  id: string;
  workflow_id: string;
  user_id: string;
  status: 'idle' | 'running' | 'success' | 'error' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  logs: LogLine[];
  result: Record<string, any> | null;
}

/**
 * Trigger execution run of a workflow
 */
export async function triggerRun(workflowId: string): Promise<RunRecord> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/runs/trigger', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workflowId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to trigger execution run: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get run execution history for a workflow
 */
export async function listRuns(workflowId: string): Promise<RunRecord[]> {
  const { data, error } = await supabase
    .from('run_records')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('started_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as RunRecord[];
}

/**
 * Get execution details and logs of a single run
 */
export async function getRun(runId: string): Promise<RunRecord> {
  const { data, error } = await supabase
    .from('run_records')
    .select('*')
    .eq('id', runId)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Run record not found');
  }

  return data as RunRecord;
}

/**
 * Establishes a database polling connection to stream logs in real-time
 */
export function streamRunLogs(
  runId: string,
  onLogLine: (log: LogLine) => void,
  onComplete?: (status: string) => void,
  onError?: (error: any) => void
): () => void {
  let active = true;
  const seenLogIds = new Set<string>();

  const poll = async () => {
    if (!active) return;
    try {
      const { data, error } = await supabase
        .from('run_records')
        .select('status, logs')
        .eq('id', runId)
        .single();

      if (error) {
        throw error;
      }

      if (!active) return;

      const logs = (data?.logs || []) as LogLine[];
      for (const log of logs) {
        if (!seenLogIds.has(log.id)) {
          seenLogIds.add(log.id);
          onLogLine(log);
        }
      }

      if (data?.status === 'success' || data?.status === 'error' || data?.status === 'cancelled') {
        active = false;
        if (onComplete) {
          onComplete(data.status);
        }
      }
    } catch (err) {
      console.error('Error polling run logs:', err);
      if (onError) {
        onError(err);
      }
    }
  };

  // Perform initial poll immediately
  poll();

  const intervalId = setInterval(poll, 1500);

  // Return a cleanup/disconnect function
  return () => {
    active = false;
    clearInterval(intervalId);
  };
}

