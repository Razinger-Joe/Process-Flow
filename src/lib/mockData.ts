import type {
  Workflow,
  WorkflowNode,
  LogLine,
  RunRecord,
  NodeStatus,
  PaletteCategory,
} from '@/types/workflow';

// ============================================================
// NODE PALETTE CATEGORIES — used by the left sidebar
// ============================================================
export const paletteCategories: PaletteCategory[] = [
  {
    label: 'Triggers',
    type: 'trigger',
    color: 'amber',
    nodes: [
      {
        type: 'trigger',
        label: 'Manual trigger',
        description: 'Start workflow manually with a button click',
        icon: 'MousePointerClick',
      },
      {
        type: 'trigger',
        label: 'Scheduler trigger',
        description: 'Run on a time-based schedule (cron)',
        icon: 'Clock',
      },
      {
        type: 'trigger',
        label: 'Webhook trigger',
        description: 'Start when an HTTP webhook is received',
        icon: 'Webhook',
      },
    ],
  },
  {
    label: 'Actions',
    type: 'action',
    color: 'violet',
    nodes: [
      {
        type: 'action',
        label: 'HTTP request',
        description: 'Make an HTTP GET/POST request to an API',
        icon: 'Globe',
      },
      {
        type: 'action',
        label: 'Send email',
        description: 'Send an email via SMTP',
        icon: 'Mail',
      },
      {
        type: 'action',
        label: 'Send webhook',
        description: 'POST data to an external webhook URL',
        icon: 'Send',
      },
    ],
  },
  {
    label: 'Logic',
    type: 'logic',
    color: 'blue',
    nodes: [
      {
        type: 'logic',
        label: 'Condition',
        description: 'If/else branch based on a condition',
        icon: 'GitBranch',
      },
      {
        type: 'logic',
        label: 'Data transform',
        description: 'Map, filter, or reshape data between steps',
        icon: 'Shuffle',
      },
      {
        type: 'logic',
        label: 'Loop',
        description: 'Iterate over a list of items',
        icon: 'Repeat',
      },
    ],
  },
  {
    label: 'Output',
    type: 'output',
    color: 'emerald',
    nodes: [
      {
        type: 'output',
        label: 'Log result',
        description: 'Write a message to the execution log',
        icon: 'FileText',
      },
      {
        type: 'output',
        label: 'Notify',
        description: 'Send a push/SMS/Slack notification',
        icon: 'Bell',
      },
      {
        type: 'output',
        label: 'Write to file',
        description: 'Save output data to a file or database',
        icon: 'HardDrive',
      },
    ],
  },
];

// ============================================================
// SAMPLE WORKFLOWS — pre-loaded for instant demo
// ============================================================
export const sampleWorkflows: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Daily weather alert',
    description:
      'Checks weather API every morning and sends an SMS to farmers if rain is detected.',
    nodes: [
      {
        id: 'n1-1',
        type: 'trigger',
        label: 'Scheduler trigger',
        description: 'Runs every day at 6:00 AM',
        position: { x: 80, y: 200 },
        config: { cron: '0 6 * * *', timezone: 'Africa/Nairobi' },
        status: 'idle',
      },
      {
        id: 'n1-2',
        type: 'action',
        label: 'HTTP request',
        description: 'Fetch weather data from OpenWeatherMap API',
        position: { x: 320, y: 200 },
        config: {
          method: 'GET',
          url: 'https://api.openweathermap.org/data/2.5/weather?q=Nairobi',
        },
        status: 'idle',
      },
      {
        id: 'n1-3',
        type: 'logic',
        label: 'Condition',
        description: 'Check if weather contains rain',
        position: { x: 560, y: 200 },
        config: { field: 'weather.main', operator: 'equals', value: 'Rain' },
        status: 'idle',
      },
      {
        id: 'n1-4',
        type: 'output',
        label: 'Send email',
        description: 'Alert farmers about expected rainfall',
        position: { x: 800, y: 100 },
        config: {
          to: 'farmers@example.com',
          subject: '🌧️ Rain Alert',
          body: 'Rain is expected today. Plan accordingly.',
        },
        status: 'idle',
      },
      {
        id: 'n1-5',
        type: 'output',
        label: 'Log result',
        description: 'Log the weather check result',
        position: { x: 800, y: 320 },
        config: { message: 'Weather check complete — no rain detected' },
        status: 'idle',
      },
    ],
    edges: [
      { id: 'e1-1', source: 'n1-1', target: 'n1-2' },
      { id: 'e1-2', source: 'n1-2', target: 'n1-3' },
      { id: 'e1-3', source: 'n1-3', target: 'n1-4', label: 'Rain detected' },
      { id: 'e1-4', source: 'n1-3', target: 'n1-5', label: 'No rain' },
    ],
    createdAt: '2025-11-15T08:30:00Z',
    updatedAt: '2026-06-10T14:22:00Z',
    lastRunAt: '2026-06-14T06:00:00Z',
    lastRunStatus: 'success',
  },
  {
    id: 'wf-2',
    name: 'Invoice processor',
    description:
      'Receives invoices via webhook, validates the amount, and routes to email or external system.',
    nodes: [
      {
        id: 'n2-1',
        type: 'trigger',
        label: 'Webhook trigger',
        description: 'Listens for incoming invoice payloads',
        position: { x: 80, y: 200 },
        config: { path: '/webhooks/invoices', method: 'POST' },
        status: 'idle',
      },
      {
        id: 'n2-2',
        type: 'logic',
        label: 'Data transform',
        description: 'Extract and normalize invoice fields',
        position: { x: 320, y: 200 },
        config: { mapping: 'amount → number, vendor → string' },
        status: 'idle',
      },
      {
        id: 'n2-3',
        type: 'logic',
        label: 'Condition',
        description: 'Check if invoice amount exceeds threshold',
        position: { x: 560, y: 200 },
        config: { field: 'amount', operator: 'greater_than', value: '10000' },
        status: 'idle',
      },
      {
        id: 'n2-4',
        type: 'output',
        label: 'Send email',
        description: 'Notify finance team of high-value invoice',
        position: { x: 800, y: 100 },
        config: {
          to: 'finance@example.com',
          subject: '⚠️ High-value invoice',
          body: 'An invoice over $10,000 requires manual review.',
        },
        status: 'idle',
      },
      {
        id: 'n2-5',
        type: 'action',
        label: 'Send webhook',
        description: 'Forward approved invoice to accounting system',
        position: { x: 800, y: 320 },
        config: { url: 'https://accounting.example.com/api/invoices' },
        status: 'idle',
      },
    ],
    edges: [
      { id: 'e2-1', source: 'n2-1', target: 'n2-2' },
      { id: 'e2-2', source: 'n2-2', target: 'n2-3' },
      {
        id: 'e2-3',
        source: 'n2-3',
        target: 'n2-4',
        label: 'Above threshold',
      },
      {
        id: 'e2-4',
        source: 'n2-3',
        target: 'n2-5',
        label: 'Below threshold',
      },
    ],
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2026-06-08T09:15:00Z',
    lastRunAt: '2026-06-13T11:30:00Z',
    lastRunStatus: 'success',
  },
  {
    id: 'wf-3',
    name: 'Weekly finance report',
    description:
      'Generates a weekly finance summary from the API and emails it to the leadership team.',
    nodes: [
      {
        id: 'n3-1',
        type: 'trigger',
        label: 'Scheduler trigger',
        description: 'Runs every Monday at 8:00 AM',
        position: { x: 80, y: 200 },
        config: { cron: '0 8 * * 1', timezone: 'UTC' },
        status: 'idle',
      },
      {
        id: 'n3-2',
        type: 'action',
        label: 'HTTP request',
        description: 'Fetch financial data from internal API',
        position: { x: 320, y: 200 },
        config: {
          method: 'GET',
          url: 'https://internal-api.example.com/finance/weekly-summary',
        },
        status: 'idle',
      },
      {
        id: 'n3-3',
        type: 'logic',
        label: 'Data transform',
        description: 'Format raw data into an HTML report table',
        position: { x: 560, y: 200 },
        config: { template: 'weekly_report_v2', format: 'html' },
        status: 'idle',
      },
      {
        id: 'n3-4',
        type: 'output',
        label: 'Send email',
        description: 'Email the formatted report to leadership',
        position: { x: 800, y: 200 },
        config: {
          to: 'leadership@example.com',
          subject: '📊 Weekly Finance Report',
          body: '{{report_html}}',
        },
        status: 'idle',
      },
    ],
    edges: [
      { id: 'e3-1', source: 'n3-1', target: 'n3-2' },
      { id: 'e3-2', source: 'n3-2', target: 'n3-3' },
      { id: 'e3-3', source: 'n3-3', target: 'n3-4' },
    ],
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-06-12T16:45:00Z',
    lastRunAt: '2026-06-10T08:00:00Z',
    lastRunStatus: 'error',
  },
];

// ============================================================
// MOCK API HELPERS
// ============================================================

/** Simulates fetching all workflows (dashboard) */
export async function fetchWorkflows(): Promise<Workflow[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...sampleWorkflows]), 600);
  });
}

/** Simulates fetching a single workflow by ID */
export async function fetchWorkflow(id: string): Promise<Workflow | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const wf = sampleWorkflows.find((w) => w.id === id) ?? null;
      // Return a deep copy so mutations don't affect the source
      resolve(wf ? JSON.parse(JSON.stringify(wf)) : null);
    }, 400);
  });
}

/** Simulates saving a workflow */
export async function saveWorkflow(workflow: Workflow): Promise<Workflow> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...workflow,
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  });
}

/** Simulates deleting a workflow */
export async function deleteWorkflow(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 300);
  });
}

// ============================================================
// RUN SIMULATION — the star of the show
// ============================================================

/** Messages generated per node type during simulation */
const nodeMessages: Record<string, string[]> = {
  'Scheduler trigger': [
    'Cron expression matched — triggering workflow',
    'Trigger activated successfully',
  ],
  'Manual trigger': [
    'Manual trigger initiated by user',
    'Workflow execution started',
  ],
  'Webhook trigger': [
    'Incoming webhook received (POST /webhooks/invoices)',
    'Payload validated — 3 fields extracted',
  ],
  'HTTP request': [
    'Sending GET request to external API…',
    'Response received — 200 OK (124ms)',
  ],
  'Send email': [
    'Composing email to recipient…',
    'Email sent successfully via SMTP',
  ],
  'Send webhook': [
    'Sending POST request to webhook endpoint…',
    'Webhook delivered — 201 Created',
  ],
  Condition: [
    'Evaluating condition: checking field value…',
    'Condition resolved — taking "true" branch',
  ],
  'Data transform': [
    'Applying data transformation template…',
    'Transform complete — 5 fields mapped',
  ],
  Loop: [
    'Starting loop iteration (3 items)…',
    'Loop completed — all items processed',
  ],
  'Log result': [
    'Writing result to execution log…',
    'Log entry recorded successfully',
  ],
  Notify: [
    'Preparing notification payload…',
    'Notification dispatched to channel',
  ],
  'Write to file': [
    'Opening file handle for output…',
    'Data written successfully (2.4 KB)',
  ],
};

/**
 * Topologically sorts workflow nodes based on edges.
 * Falls back to the original order for disconnected nodes.
 */
function topologicalSort(
  nodes: WorkflowNode[],
  edges: { source: string; target: string }[]
): WorkflowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: WorkflowNode[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = nodeMap.get(current);
    if (node) sorted.push(node);

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return sorted;
}

/**
 * Simulates running a workflow.
 * Iterates through nodes in topological order, updating status and
 * appending log lines with realistic delays.
 */
export function runWorkflow(
  workflow: Workflow,
  callbacks: {
    onNodeStatusChange: (nodeId: string, status: NodeStatus) => void;
    onLog: (log: LogLine) => void;
    onComplete: (status: NodeStatus) => void;
  }
): { cancel: () => void } {
  let cancelled = false;
  const sortedNodes = topologicalSort(workflow.nodes, workflow.edges);

  const run = async () => {
    for (let i = 0; i < sortedNodes.length; i++) {
      if (cancelled) return;

      const node = sortedNodes[i];

      // Mark node as running
      callbacks.onNodeStatusChange(node.id, 'running');

      // First log line — "starting"
      callbacks.onLog({
        id: `log-${node.id}-1-${Date.now()}`,
        timestamp: new Date().toISOString(),
        nodeId: node.id,
        nodeName: node.label,
        level: 'info',
        message:
          nodeMessages[node.label]?.[0] ?? `Executing ${node.label}…`,
      });

      // Wait 600ms
      await delay(600);
      if (cancelled) return;

      // Second log line — "done"
      callbacks.onLog({
        id: `log-${node.id}-2-${Date.now()}`,
        timestamp: new Date().toISOString(),
        nodeId: node.id,
        nodeName: node.label,
        level: 'success',
        message:
          nodeMessages[node.label]?.[1] ?? `${node.label} completed`,
      });

      // Wait another 600ms then mark success
      await delay(600);
      if (cancelled) return;

      callbacks.onNodeStatusChange(node.id, 'success');
    }

    // All done
    callbacks.onLog({
      id: `log-complete-${Date.now()}`,
      timestamp: new Date().toISOString(),
      nodeId: 'system',
      nodeName: 'System',
      level: 'success',
      message: `✅ Workflow "${workflow.name}" completed successfully`,
    });

    callbacks.onComplete('success');
  };

  run();

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// MOCK RUN HISTORY
// ============================================================
export const sampleRunRecords: RunRecord[] = [
  {
    id: 'run-1',
    workflowId: 'wf-1',
    startedAt: '2026-06-14T06:00:00Z',
    completedAt: '2026-06-14T06:00:06Z',
    status: 'success',
    logs: [
      {
        id: 'rl-1',
        timestamp: '2026-06-14T06:00:00Z',
        nodeId: 'n1-1',
        nodeName: 'Scheduler trigger',
        level: 'info',
        message: 'Cron expression matched — triggering workflow',
      },
      {
        id: 'rl-2',
        timestamp: '2026-06-14T06:00:01Z',
        nodeId: 'n1-1',
        nodeName: 'Scheduler trigger',
        level: 'success',
        message: 'Trigger activated successfully',
      },
      {
        id: 'rl-3',
        timestamp: '2026-06-14T06:00:02Z',
        nodeId: 'n1-2',
        nodeName: 'HTTP request',
        level: 'info',
        message: 'Sending GET request to external API…',
      },
      {
        id: 'rl-4',
        timestamp: '2026-06-14T06:00:03Z',
        nodeId: 'n1-2',
        nodeName: 'HTTP request',
        level: 'success',
        message: 'Response received — 200 OK (124ms)',
      },
      {
        id: 'rl-5',
        timestamp: '2026-06-14T06:00:04Z',
        nodeId: 'n1-3',
        nodeName: 'Condition',
        level: 'info',
        message: 'Evaluating condition: checking field value…',
      },
      {
        id: 'rl-6',
        timestamp: '2026-06-14T06:00:05Z',
        nodeId: 'n1-3',
        nodeName: 'Condition',
        level: 'success',
        message: 'Condition resolved — taking "true" branch',
      },
      {
        id: 'rl-7',
        timestamp: '2026-06-14T06:00:05Z',
        nodeId: 'n1-4',
        nodeName: 'Send email',
        level: 'info',
        message: 'Composing email to recipient…',
      },
      {
        id: 'rl-8',
        timestamp: '2026-06-14T06:00:06Z',
        nodeId: 'n1-4',
        nodeName: 'Send email',
        level: 'success',
        message: 'Email sent successfully via SMTP',
      },
    ],
  },
  {
    id: 'run-2',
    workflowId: 'wf-2',
    startedAt: '2026-06-13T11:30:00Z',
    completedAt: '2026-06-13T11:30:05Z',
    status: 'success',
    logs: [
      {
        id: 'rl-9',
        timestamp: '2026-06-13T11:30:00Z',
        nodeId: 'n2-1',
        nodeName: 'Webhook trigger',
        level: 'info',
        message: 'Incoming webhook received (POST /webhooks/invoices)',
      },
      {
        id: 'rl-10',
        timestamp: '2026-06-13T11:30:01Z',
        nodeId: 'n2-1',
        nodeName: 'Webhook trigger',
        level: 'success',
        message: 'Payload validated — 3 fields extracted',
      },
      {
        id: 'rl-11',
        timestamp: '2026-06-13T11:30:02Z',
        nodeId: 'n2-2',
        nodeName: 'Data transform',
        level: 'info',
        message: 'Applying data transformation template…',
      },
      {
        id: 'rl-12',
        timestamp: '2026-06-13T11:30:03Z',
        nodeId: 'n2-2',
        nodeName: 'Data transform',
        level: 'success',
        message: 'Transform complete — 5 fields mapped',
      },
    ],
  },
  {
    id: 'run-3',
    workflowId: 'wf-3',
    startedAt: '2026-06-10T08:00:00Z',
    completedAt: '2026-06-10T08:00:04Z',
    status: 'error',
    logs: [
      {
        id: 'rl-13',
        timestamp: '2026-06-10T08:00:00Z',
        nodeId: 'n3-1',
        nodeName: 'Scheduler trigger',
        level: 'info',
        message: 'Cron expression matched — triggering workflow',
      },
      {
        id: 'rl-14',
        timestamp: '2026-06-10T08:00:01Z',
        nodeId: 'n3-1',
        nodeName: 'Scheduler trigger',
        level: 'success',
        message: 'Trigger activated successfully',
      },
      {
        id: 'rl-15',
        timestamp: '2026-06-10T08:00:02Z',
        nodeId: 'n3-2',
        nodeName: 'HTTP request',
        level: 'info',
        message: 'Sending GET request to external API…',
      },
      {
        id: 'rl-16',
        timestamp: '2026-06-10T08:00:03Z',
        nodeId: 'n3-2',
        nodeName: 'HTTP request',
        level: 'error',
        message: 'Request failed — 503 Service Unavailable',
      },
      {
        id: 'rl-17',
        timestamp: '2026-06-10T08:00:04Z',
        nodeId: 'system',
        nodeName: 'System',
        level: 'error',
        message: 'Workflow aborted due to upstream failure',
      },
    ],
  },
];

/** Simulates fetching run history for a workflow */
export async function fetchRunHistory(
  workflowId: string
): Promise<RunRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        sampleRunRecords.filter((r) => r.workflowId === workflowId)
      );
    }, 400);
  });
}

/** Simulates fetching a single run by ID */
export async function fetchRunRecord(
  runId: string
): Promise<RunRecord | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sampleRunRecords.find((r) => r.id === runId) ?? null);
    }, 300);
  });
}
