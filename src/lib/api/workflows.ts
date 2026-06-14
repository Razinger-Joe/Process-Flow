import { apiClient } from './client';

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  definition: {
    nodes: any[];
    edges: any[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreateData {
  name: string;
  description?: string | null;
  definition?: {
    nodes: any[];
    edges: any[];
  };
}

export interface WorkflowUpdateData {
  name?: string;
  description?: string | null;
  definition?: {
    nodes: any[];
    edges: any[];
  };
  is_active?: boolean;
}

/**
 * Fetch all workflows owned by the current user
 */
export async function listWorkflows(): Promise<Workflow[]> {
  const response = await apiClient.get<Workflow[]>('/workflows/');
  return response.data;
}

/**
 * Fetch a single workflow by ID
 */
export async function getWorkflow(id: string): Promise<Workflow> {
  const response = await apiClient.get<Workflow>(`/workflows/${id}`);
  return response.data;
}

/**
 * Create a new workflow
 */
export async function createWorkflow(data: WorkflowCreateData): Promise<Workflow> {
  const response = await apiClient.post<Workflow>('/workflows/', {
    name: data.name,
    description: data.description || null,
    definition: data.definition || { nodes: [], edges: [] },
  });
  return response.data;
}

/**
 * Update a workflow
 */
export async function updateWorkflow(id: string, data: WorkflowUpdateData): Promise<Workflow> {
  const response = await apiClient.put<Workflow>(`/workflows/${id}`, data);
  return response.data;
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string): Promise<void> {
  await apiClient.delete(`/workflows/${id}`);
}
