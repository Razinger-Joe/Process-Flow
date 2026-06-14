'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Navbar } from '@/components/layout/Navbar';
import { WorkflowGrid } from '@/components/dashboard/WorkflowGrid';
import { listWorkflows, createWorkflow } from '@/lib/api/workflows';
import type { Workflow, NodeStatus } from '@/types/workflow';
import { isEnvValid, getMaskedEnv } from '@/lib/supabase';

import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';

// ============================================================
// Status filter options
// ============================================================
type FilterStatus = 'all' | NodeStatus;

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'error', label: 'Error' },
  { value: 'running', label: 'Running' },
  { value: 'idle', label: 'Idle' },
];

// ============================================================
// Dashboard page
// ============================================================
export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Fetch workflows on mount
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    if (!isEnvValid()) {
      const masked = getMaskedEnv();
      toast.error(`Supabase configuration is invalid! URL: "${masked.url}", Key: "${masked.key}". Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.`, 'Config Error');
      setIsLoading(false);
      return;
    }

    listWorkflows()
      .then((data) => {
        if (mounted) {
          const mapped = data.map((w: any) => ({
            id: w.id,
            name: w.name,
            description: w.description || '',
            nodes: w.definition?.nodes || [],
            edges: w.definition?.edges || [],
            createdAt: w.created_at,
            updatedAt: w.updated_at,
            lastRunAt: w.last_run_at || undefined,
            lastRunStatus: (w.last_run_status as NodeStatus) || 'idle',
          }));
          setWorkflows(mapped);
          setIsLoading(false);
        }
      })
      .catch((error: any) => {
        console.error('Error listing workflows:', error);
        toast.error(`Failed to load workflows: ${error?.message || error || 'Please check your backend connection.'}`);
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateWorkflow = async () => {
    setIsCreating(true);
    try {
      const newWf = await createWorkflow({
        name: 'Untitled Workflow',
        description: 'New workflow automation',
        definition: { nodes: [], edges: [] },
      });
      toast.success('Workflow created successfully!', 'Success');
      router.push(`/editor/${newWf.id}`);
    } catch (error: any) {
      console.error('Error creating workflow:', error);
      toast.error(`Failed to create new workflow: ${error?.message || error || 'Please try again.'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    let result = workflows;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (wf) =>
          wf.name.toLowerCase().includes(q) ||
          (wf.description?.toLowerCase().includes(q) ?? false)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(
        (wf) => (wf as any).lastRunStatus === statusFilter
      );
    }

    return result;
  }, [workflows, searchQuery, statusFilter]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* ------------------------------------------------ */}
        {/* Page header                                       */}
        {/* ------------------------------------------------ */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Workflows
          </h1>
          <Button
            onClick={handleCreateWorkflow}
            disabled={isCreating}
            className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            {isCreating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            New Workflow
          </Button>
        </div>

        {/* ------------------------------------------------ */}
        {/* Search + Filter row                               */}
        {/* ------------------------------------------------ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workflows…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as FilterStatus)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ------------------------------------------------ */}
        {/* Workflow grid                                      */}
        {/* ------------------------------------------------ */}
        <WorkflowGrid
          workflows={filteredWorkflows}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
