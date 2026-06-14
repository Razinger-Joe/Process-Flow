import { apiClient } from './client';

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
  status: 'idle' | 'running' | 'success' | 'error';
  started_at: string;
  completed_at: string | null;
  logs: LogLine[];
  result: Record<string, any> | null;
}

/**
 * Trigger execution run of a workflow
 */
export async function triggerRun(workflowId: string): Promise<RunRecord> {
  const response = await apiClient.post<RunRecord>(`/runs/${workflowId}/trigger`);
  return response.data;
}

/**
 * Get run execution history for a workflow
 */
export async function listRuns(workflowId: string): Promise<RunRecord[]> {
  const response = await apiClient.get<RunRecord[]>(`/runs/workflow/${workflowId}`);
  return response.data;
}

/**
 * Get execution details and logs of a single run
 */
export async function getRun(runId: string): Promise<RunRecord> {
  const response = await apiClient.get<RunRecord>(`/runs/detail/${runId}`);
  return response.data;
}

/**
 * Establishes a Server-Sent Events (SSE) connection to stream logs in real-time
 */
export function streamRunLogs(
  runId: string,
  onLogLine: (log: LogLine) => void,
  onComplete?: (status: string) => void,
  onError?: (error: any) => void
): () => void {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const url = `${baseURL}/runs/detail/${runId}/stream`;

  const eventSource = new EventSource(url);

  eventSource.addEventListener('log', (event: MessageEvent) => {
    try {
      const logData = JSON.parse(event.data) as LogLine;
      onLogLine(logData);
    } catch (err) {
      console.error('Error parsing SSE log data:', err);
    }
  });

  eventSource.addEventListener('complete', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (onComplete) {
        onComplete(data.status);
      }
      eventSource.close();
    } catch (err) {
      console.error('Error parsing SSE complete data:', err);
      eventSource.close();
    }
  });

  eventSource.addEventListener('error', (event) => {
    if (onError) {
      onError(event);
    }
    eventSource.close();
  });

  // Return a cleanup/disconnect function
  return () => {
    if (eventSource.readyState !== eventSource.CLOSED) {
      eventSource.close();
    }
  };
}
