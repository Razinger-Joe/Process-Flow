import { SupabaseClient } from '@supabase/supabase-js';

// Execution Log interface
export interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string | null;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

// Execution Context
export class ExecutionContext {
  runId: string;
  data: Record<string, any>;
  logs: LogEntry[];
  cancelFlag: boolean;

  constructor(runId: string) {
    this.runId = runId;
    this.data = {};
    this.logs = [];
    this.cancelFlag = false;
  }

  addLog(message: string, nodeId: string | null = null, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
    this.logs.push({
      id: Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
      nodeId,
      level,
      message,
    });
  }
}

// Recursive variable template interpolation
export function interpolateValue(val: string, contextData: Record<string, any>): any {
  if (typeof val !== 'string') {
    return val;
  }

  // Exact match regex: e.g. "{{data.f2.body.transactions}}"
  const exactMatch = val.match(/^\{\{\s*(.*?)\s*\}\}$/);
  if (exactMatch) {
    const path = exactMatch[1].trim();
    const parts = path.split('.');
    let current: any = contextData;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else if ((Array.isArray(current) || (current && typeof current === 'object')) && part === 'length') {
        current = Array.isArray(current) ? current.length : Object.keys(current).length;
      } else {
        return val; // Path not found, return original string
      }
    }
    return current;
  }

  // Substring replacement: e.g. "Report: {{data.f3.list.length}} items"
  return val.replace(/\{\{(.*?)\}\}/g, (match, expression) => {
    const path = expression.trim();
    const parts = path.split('.');
    let current: any = contextData;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else if ((Array.isArray(current) || (current && typeof current === 'object')) && part === 'length') {
        current = Array.isArray(current) ? current.length : Object.keys(current).length;
      } else {
        return match; // Path not found
      }
    }
    return String(current);
  });
}

export function interpolateObject(obj: any, contextData: Record<string, any>): any {
  if (typeof obj === 'string') {
    return interpolateValue(obj, contextData);
  } else if (Array.isArray(obj)) {
    return obj.map(item => interpolateObject(item, contextData));
  } else if (obj !== null && typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      res[key] = interpolateObject(obj[key], contextData);
    }
    return res;
  }
  return obj;
}

// ── Node Runners ──────────────────────────────────────────────

// Trigger Runner
async function runTriggerNode(nodeId: string, config: any, context: ExecutionContext): Promise<any> {
  context.addLog("Trigger activated successfully", nodeId, "success");
  return config?.mock_payload || { triggered: true };
}

// HTTP Request Runner with offline DNS interception
async function runHttpRequestNode(nodeId: string, config: any, context: ExecutionContext): Promise<any> {
  const interpolated = interpolateObject(config, { data: context.data });
  const url = interpolated.url;
  const method = (interpolated.method || 'GET').toUpperCase();
  const headers = interpolated.headers ? (typeof interpolated.headers === 'string' ? JSON.parse(interpolated.headers) : interpolated.headers) : {};
  const body = interpolated.body;

  if (!url) {
    context.addLog("HTTP Request failed: 'url' parameter is missing.", nodeId, "error");
    return { error: "url parameter is missing" };
  }

  context.addLog(`HTTP Request starting: ${method} ${url}`, nodeId, "info");

  const lowerUrl = url.toLowerCase();
  
  // Intercept mock bank
  if (lowerUrl.includes('mockbank.internal')) {
    const mockData = {
      transactions: [
        { id: "T001", amount: 1200000, country: "NG", category: "Transfer", account: "ACC-8821" },
        { id: "T002", amount: 45000, country: "KE", category: "Purchase", account: "ACC-1134" },
        { id: "T003", amount: 890000, country: "KE", category: "Transfer", account: "ACC-4492" },
        { id: "T004", amount: 12000, country: "KE", category: "Purchase", account: "ACC-2201" },
        { id: "T005", amount: 670000, country: "ZA", category: "Withdrawal", account: "ACC-9981" }
      ]
    };
    context.addLog("HTTP Request intercepted (simulation). Fetched 5 transactions from mock bank API (200 OK)", nodeId, "success");
    return { status: 200, body: mockData, headers: {} };
  }
  
  // Intercept security logs
  if (lowerUrl.includes('security.internal')) {
    const mockData = {
      ip: "197.254.88.41",
      failed_count: 7,
      first_seen: "2026-06-15T09:05:12Z",
      attempts: [
        { timestamp: "2026-06-15T09:05:12Z", user: "admin@company.co.ke" },
        { timestamp: "2026-06-15T09:07:44Z", user: "admin@company.co.ke" },
        { timestamp: "2026-06-15T09:09:21Z", user: "root@company.co.ke" },
        { timestamp: "2026-06-15T09:11:05Z", user: "admin@company.co.ke" },
        { timestamp: "2026-06-15T09:12:18Z", user: "admin@company.co.ke" },
        { timestamp: "2026-06-15T09:13:55Z", user: "superuser@company.co.ke" },
        { timestamp: "2026-06-15T09:14:33Z", user: "admin@company.co.ke" }
      ]
    };
    context.addLog("HTTP Request intercepted (simulation). IP history fetched: 7 failed attempts in last 10 minutes (200 OK)", nodeId, "success");
    return { status: 200, body: mockData, headers: {} };
  }

  // Intercept firewall
  if (lowerUrl.includes('firewall.internal')) {
    context.addLog("HTTP Request intercepted (simulation). IP 197.254.88.41 added to firewall blocklist for 24 hours (200 OK)", nodeId, "success");
    return { status: 200, body: { blocked: true, ip: "197.254.88.41" }, headers: {} };
  }

  // Intercept Jira
  if (lowerUrl.includes('jira.internal')) {
    context.addLog("HTTP Request intercepted (simulation). Incident ticket SEC-2847 created in Jira (201 Created)", nodeId, "success");
    return { status: 201, body: { ticket_id: "SEC-2847", status: "created" }, headers: {} };
  }

  // Intercept Slack hooks
  if (lowerUrl.includes('hooks.slack.com')) {
    context.addLog("HTTP Request intercepted (simulation). Slack notification delivered to #soc-alerts channel (200 OK)", nodeId, "success");
    return { status: 200, body: "ok", headers: {} };
  }

  // Live HTTP request
  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : String(body);
    }

    const response = await fetch(url, fetchOptions);
    let responseBody;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    const isSuccess = response.status < 400;
    context.addLog(
      `HTTP Request completed: Status ${response.status}`,
      nodeId,
      isSuccess ? "success" : "warning"
    );

    return {
      status: response.status,
      body: responseBody,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (err: any) {
    const errorMsg = `An error occurred while requesting ${url}: ${err.message || err}`;
    context.addLog(`HTTP Request exception: ${errorMsg}`, nodeId, "error");
    return { error: errorMsg, status: 500 };
  }
}

// Condition Runner
async function runConditionNode(nodeId: string, config: any, context: ExecutionContext): Promise<any> {
  const interpolated = interpolateObject(config, { data: context.data });
  const leftVal = interpolated.field;
  const operator = (interpolated.operator || 'eq').toLowerCase();
  const rightVal = interpolated.value;

  context.addLog(`Condition: evaluating (${leftVal} ${operator} ${rightVal})`, nodeId, "info");

  let result = false;
  try {
    if (operator === 'eq') {
      result = String(leftVal) === String(rightVal);
    } else if (operator === 'neq') {
      result = String(leftVal) !== String(rightVal);
    } else if (operator === 'gt') {
      result = parseFloat(leftVal) > parseFloat(rightVal);
    } else if (operator === 'lt') {
      result = parseFloat(leftVal) < parseFloat(rightVal);
    } else if (operator === 'gte') {
      result = parseFloat(leftVal) >= parseFloat(rightVal);
    } else if (operator === 'lte') {
      result = parseFloat(leftVal) <= parseFloat(rightVal);
    } else if (operator === 'contains') {
      if (leftVal === null || leftVal === undefined) {
        result = false;
      } else if (Array.isArray(leftVal)) {
        result = leftVal.includes(rightVal);
      } else {
        result = String(leftVal).includes(String(rightVal));
      }
    } else {
      context.addLog(`Condition error: Unknown operator '${operator}'`, nodeId, "warning");
      result = false;
    }
  } catch (err: any) {
    context.addLog(`Condition evaluation warning: ${err.message || err}`, nodeId, "warning");
    result = false;
  }

  context.addLog(`Condition result: ${result}`, nodeId, "success");
  return { result };
}

// Data Transform Runner
async function runDataTransformNode(nodeId: string, config: any, context: ExecutionContext): Promise<any> {
  const interpolated = interpolateObject(config, { data: context.data });
  const operation = interpolated.operation || 'extract_field';
  const source = interpolated.source;

  context.addLog(`Data Transform starting operation '${operation}'`, nodeId, "info");

  if (source === null || source === undefined) {
    context.addLog("Data Transform warning: source is null or undefined", nodeId, "warning");
    return {};
  }

  try {
    if (operation === 'extract_field') {
      const fieldName = interpolated.field_name || interpolated.key;
      if (!fieldName) {
        context.addLog("Data Transform error: missing 'field_name'", nodeId, "error");
        return { error: "missing field_name" };
      }
      if (typeof source === 'object' && !Array.isArray(source)) {
        const extracted = source[fieldName];
        context.addLog(`Data Transform: extracted field '${fieldName}'`, nodeId, "success");
        return { value: extracted };
      } else {
        context.addLog("Data Transform warning: source is not an object", nodeId, "warning");
        return { value: null };
      }
    } else if (operation === 'rename_field') {
      const key = interpolated.key || interpolated.field_name;
      const newKey = interpolated.new_key;
      if (!key || !newKey) {
        context.addLog("Data Transform error: missing 'key' or 'new_key'", nodeId, "error");
        return { error: "missing key or new_key" };
      }
      if (typeof source === 'object' && !Array.isArray(source)) {
        const copied = { ...source };
        if (key in copied) {
          copied[newKey] = copied[key];
          delete copied[key];
          context.addLog(`Data Transform: renamed field '${key}' to '${newKey}'`, nodeId, "success");
        } else {
          context.addLog(`Data Transform: field '${key}' not found in dict`, nodeId, "warning");
        }
        return copied;
      } else {
        context.addLog("Data Transform warning: source is not an object", nodeId, "warning");
        return {};
      }
    } else if (operation === 'filter_list') {
      const key = interpolated.key || interpolated.field_name;
      const operator = (interpolated.operator || 'eq').toLowerCase();
      const val = interpolated.value;

      if (!Array.isArray(source)) {
        context.addLog("Data Transform warning: source is not a list", nodeId, "warning");
        return { list: [] };
      }

      const filtered = [];
      for (const item of source) {
        if (item === null || typeof item !== 'object' || !(key in item)) {
          continue;
        }
        const left = item[key];
        let matched = false;

        if (operator === 'eq' && String(left) === String(val)) {
          matched = true;
        } else if (operator === 'neq' && String(left) !== String(val)) {
          matched = true;
        } else if (operator === 'contains' && String(left).includes(String(val))) {
          matched = true;
        } else if (operator === 'gt' && parseFloat(left) > parseFloat(val)) {
          matched = true;
        } else if (operator === 'lt' && parseFloat(left) < parseFloat(val)) {
          matched = true;
        }

        if (matched) {
          filtered.push(item);
        }
      }

      context.addLog(`Data Transform: filtered list from ${source.length} to ${filtered.length} items`, nodeId, "success");
      return { list: filtered };
    } else {
      context.addLog(`Data Transform error: Unknown operation '${operation}'`, nodeId, "error");
      return { error: `unknown operation ${operation}` };
    }
  } catch (err: any) {
    context.addLog(`Data Transform exception: ${err.message || err}`, nodeId, "error");
    return { error: err.message || err };
  }
}

// Send Email Runner
async function runSendEmailNode(nodeId: string, config: any, context: ExecutionContext): Promise<any> {
  const interpolated = interpolateObject(config, { data: context.data });
  const to = interpolated.to;
  const subject = interpolated.subject;
  const body = interpolated.body_template || interpolated.body || "";

  context.addLog(`Send Email: preparing message to ${to}`, nodeId, "info");
  context.addLog(`[SMTP DRY-RUN] Email successfully generated!\n  To: ${to}\n  Subject: ${subject}\n  Content: ${body.substring(0, 150)}...`, nodeId, "success");
  return { sent: true };
}

// Log Result Runner
async function runLogResultNode(nodeId: string, config: any, context: ExecutionContext): Promise<any> {
  const interpolated = interpolateObject(config, { data: context.data });
  const message = interpolated.message || "";
  context.addLog(`LOG: ${message}`, nodeId, "success");
  return { message };
}

// Execution Map
const RUNNERS: Record<string, (nodeId: string, config: any, context: ExecutionContext) => Promise<any>> = {
  "HTTP request": runHttpRequestNode,
  "Send email": runSendEmailNode,
  "Condition": runConditionNode,
  "Data transform": runDataTransformNode,
  "Log result": runLogResultNode,
  "Scheduler trigger": runTriggerNode,
  "Manual trigger": runTriggerNode,
  "Webhook trigger": runTriggerNode,
};

// ── Execution Engine Orchestrator ──────────────────────────────

export class WorkflowEngine {
  private db: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.db = supabaseClient;
  }

  async execute(runId: string): Promise<void> {
    console.log(`Starting TS engine execution for run ${runId}...`);

    // 1. Fetch the Run Record
    const { data: runRecord, error: runError } = await this.db
      .from('run_records')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !runRecord) {
      console.error(`Engine Error: Run Record ${runId} not found.`, runError);
      return;
    }

    // 2. Fetch the Workflow definition
    const { data: workflow, error: wfError } = await this.db
      .from('workflows')
      .select('*')
      .eq('id', runRecord.workflow_id)
      .single();

    if (wfError || !workflow || !workflow.is_active) {
      await this.db
        .from('run_records')
        .update({
          status: 'error',
          completed_at: new Date().toISOString(),
          logs: [
            {
              id: 'system-error',
              timestamp: new Date().toISOString(),
              nodeId: 'system',
              level: 'error',
              message: 'Workflow definition not found or deactivated.'
            }
          ]
        })
        .eq('id', runId);
      return;
    }

    // 3. Mark run as running
    await this.db
      .from('run_records')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        logs: []
      })
      .eq('id', runId);

    const context = new ExecutionContext(runId);
    context.addLog(`⚡ Starting execution for workflow: '${workflow.name}'`, "system", "info");

    try {
      const definition = workflow.definition || {};
      const nodes = definition.nodes || [];
      const edges = definition.edges || [];

      if (nodes.length === 0) {
        throw new Error("Workflow contains no nodes.");
      }

      // Find trigger root node
      let triggerNode = nodes.find((node: any) => node.type === 'trigger');
      if (!triggerNode) {
        // Fallback: node with no incoming edges
        const targets = new Set(edges.map((edge: any) => edge.target));
        triggerNode = nodes.find((node: any) => !targets.has(node.id));
      }

      if (!triggerNode) {
        throw new Error("Could not determine a trigger/starting node for the workflow.");
      }

      // Adjacency list
      const adjList: Record<string, Array<{ target: string; sourceHandle: string | null }>> = {};
      for (const node of nodes) {
        adjList[node.id] = [];
      }
      for (const edge of edges) {
        const source = edge.source;
        if (adjList[source]) {
          adjList[source].push({
            target: edge.target,
            sourceHandle: edge.sourceHandle || null,
          });
        }
      }

      const nodeMap = Object.fromEntries(nodes.map((n: any) => [n.id, n]));

      // Graph traversal loop
      const queue = [triggerNode.id];
      const visited = new Set<string>();
      let lastOutput: any = {};

      while (queue.length > 0) {
        // Check for cancellation
        const { data: currentRecord } = await this.db
          .from('run_records')
          .select('status')
          .eq('id', runId)
          .single();

        if (currentRecord && currentRecord.status === 'cancelled') {
          context.addLog("Workflow execution cancelled by user.", "system", "warning");
          context.cancelFlag = true;
          break;
        }

        const currId = queue.shift()!;
        if (visited.has(currId)) {
          continue;
        }

        const node = nodeMap[currId];
        if (!node) {
          continue;
        }

        const nodeLabel = node.label || "";
        const nodeType = node.type || "";
        const config = node.config || {};

        // Find correct runner
        let runnerFunc = null;
        for (const [runnerName, func] of Object.entries(RUNNERS)) {
          if (nodeLabel.startsWith(runnerName)) {
            runnerFunc = func;
            break;
          }
        }

        if (!runnerFunc) {
          context.addLog(`Warning: No runner found for node '${nodeLabel}' (type: ${nodeType}). Using stub.`, currId, "warning");
          runnerFunc = runTriggerNode;
        }

        context.addLog(`Executing step '${nodeLabel}'...`, currId, "info");

        // Simulate step latency (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          const output = await runnerFunc(currId, config, context);
          context.data[currId] = output;
          lastOutput = output;
        } catch (nodeErr: any) {
          context.addLog(`Execution failed on step '${nodeLabel}': ${nodeErr.message || nodeErr}`, currId, "error");
          throw nodeErr;
        }

        visited.add(currId);

        // Process downstream edges
        const outgoing = adjList[currId] || [];
        if (nodeLabel.startsWith("Condition")) {
          const conditionVal = lastOutput?.result === true;
          const targetHandle = conditionVal ? 'true' : 'false';
          context.addLog(`Branching: following '${targetHandle}' path`, currId, "info");

          for (const edge of outgoing) {
            if (String(edge.sourceHandle).toLowerCase() === targetHandle) {
              queue.push(edge.target);
            }
          }
        } else {
          for (const edge of outgoing) {
            queue.push(edge.target);
          }
        }

        // Periodically sync logs
        await this.db
          .from('run_records')
          .update({ logs: context.logs })
          .eq('id', runId);
      }

      // Mark success
      if (!context.cancelFlag) {
        context.addLog("✅ Workflow completed successfully.", "system", "success");
        await this.db
          .from('run_records')
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            logs: context.logs,
            result: lastOutput,
          })
          .eq('id', runId);
      }
    } catch (err: any) {
      context.addLog(`❌ Workflow execution aborted due to error: ${err.message || err}`, "system", "error");
      await this.db
        .from('run_records')
        .update({
          status: 'error',
          completed_at: new Date().toISOString(),
          logs: context.logs,
        })
        .eq('id', runId);
    }
  }
}
