import { supabase } from '../supabase';

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

// Default Finance Workflow Template Definition
const financeDefinition = {
  nodes: [
    {
      id: "f1",
      type: "trigger",
      label: "Scheduler trigger",
      description: "Fires every Monday at 8:00 AM EAT",
      position: { x: 100, y: 200 },
      config: {
        cron: "0 8 * * MON",
        timezone: "Africa/Nairobi",
        description: "Fires every Monday at 8:00 AM EAT"
      }
    },
    {
      id: "f2",
      type: "action",
      label: "HTTP request — fetch transactions",
      description: "Pulls all transactions from the past 7 days",
      position: { x: 350, y: 200 },
      config: {
        url: "https://mockbank.internal/api/transactions?period=last_7_days",
        method: "GET",
        headers: "{\"Authorization\": \"Bearer {{env.BANK_API_KEY}}\"}",
        description: "Pulls all transactions from the past 7 days"
      }
    },
    {
      id: "f3",
      type: "logic",
      label: "Data transform — extract suspicious",
      description: "Flags transactions from outside Kenya",
      position: { x: 600, y: 200 },
      config: {
        operation: "filter_list",
        source: "{{data.f2.body.transactions}}",
        key: "country",
        operator: "neq",
        value: "KE",
        description: "Flags transactions from outside Kenya"
      }
    },
    {
      id: "f4",
      type: "logic",
      label: "Condition — any suspicious found?",
      description: "Branches based on whether fraud was detected",
      position: { x: 850, y: 200 },
      config: {
        field: "{{data.f3.list.length}}",
        operator: "gt",
        value: "0",
        description: "Branches based on whether fraud was detected"
      }
    },
    {
      id: "f5",
      type: "action",
      label: "Send email — compliance alert",
      description: "Sends fraud alert only if suspicious transactions exist",
      position: { x: 1100, y: 50 },
      config: {
        to: "compliance@company.co.ke",
        subject: "🚨 ALERT: Suspicious transactions detected outside Kenya",
        body_template: "Dear Compliance Team,\n\nOur automated system has flagged {{data.f3.list.length}} suspicious international transactions this week.\n\nPlease review immediately: {{data.f3.list}}\n\nProcessFlow Studio — Automated Alert",
        description: "Sends fraud alert only if suspicious transactions exist"
      }
    },
    {
      id: "f6",
      type: "logic",
      label: "Data transform — compute report",
      description: "Extracts transactions list for summary stats",
      position: { x: 1100, y: 350 },
      config: {
        operation: "extract_field",
        source: "{{data.f2.body}}",
        field_name: "transactions",
        description: "Extracts transactions list for summary stats"
      }
    },
    {
      id: "f7",
      type: "output",
      label: "Send email — weekly report",
      description: "Weekly report to management regardless of fraud status",
      position: { x: 1350, y: 200 },
      config: {
        to: "cfo@company.co.ke, management@company.co.ke",
        subject: "📊 Weekly Transaction Report",
        body_template: "Weekly Financial Summary\n\nTotal Transactions: {{data.f6.value.length}}\nSuspicious Flagged: {{data.f3.list.length}}\n\n— ProcessFlow Studio",
        description: "Weekly report to management regardless of fraud status"
      }
    },
    {
      id: "f8",
      type: "output",
      label: "Log result",
      description: "Final audit log entry",
      position: { x: 1600, y: 200 },
      config: {
        message: "Weekly financial audit execution completed successfully. {{data.f6.value.length}} transactions processed. {{data.f3.list.length}} flagged.",
        description: "Final audit log entry"
      }
    }
  ],
  edges: [
    { id: "fe1", source: "f1", target: "f2" },
    { id: "fe2", source: "f2", target: "f3" },
    { id: "fe3", source: "f3", target: "f4" },
    { id: "fe4", source: "f4", target: "f5", sourceHandle: "true", label: "Yes — fraud found" },
    { id: "fe5", source: "f4", target: "f6", sourceHandle: "false", label: "No — clean week" },
    { id: "fe6", source: "f5", target: "f6" },
    { id: "fe7", source: "f6", target: "f7" },
    { id: "fe8", source: "f7", target: "f8" }
  ]
};

// Default Cybersecurity Workflow Template Definition
const cyberDefinition = {
  nodes: [
    {
      id: "c1",
      type: "trigger",
      label: "Webhook trigger — auth log event",
      description: "Receives failed login events in real time",
      position: { x: 100, y: 200 },
      config: {
        endpoint: "/webhooks/auth-events",
        method: "POST",
        expected_payload: "{\"event\": \"login_failed\", \"ip\": \"string\", \"user\": \"string\", \"timestamp\": \"ISO8601\"}",
        mock_payload: {
          ip: "197.254.88.41",
          user: "admin@company.co.ke",
          event: "login_failed"
        },
        description: "Receives every failed login event from the auth system in real time"
      }
    },
    {
      id: "c2",
      type: "action",
      label: "HTTP request — fetch IP history",
      description: "Checks how many times this IP has failed in the last 10 minutes",
      position: { x: 350, y: 200 },
      config: {
        url: "https://security.internal/api/failed-logins?ip={{data.c1.ip}}&window=10m",
        method: "GET",
        description: "Checks how many times this IP has failed in the last 10 minutes"
      }
    },
    {
      id: "c3",
      type: "logic",
      label: "Condition — threshold breached?",
      description: "Triggers response only if 5 or more failures detected",
      position: { x: 600, y: 200 },
      config: {
        field: "{{data.c2.body.failed_count}}",
        operator: "gte",
        value: "5",
        description: "Triggers response only if 5 or more failures detected"
      }
    },
    {
      id: "c4",
      type: "action",
      label: "HTTP request — block IP",
      description: "Adds the offending IP to the firewall blocklist for 24 hours",
      position: { x: 850, y: 50 },
      config: {
        url: "https://firewall.internal/api/blocklist",
        method: "POST",
        body: "{\"ip\": \"{{data.c1.ip}}\", \"reason\": \"Brute force detected\", \"duration_hours\": 24}",
        description: "Adds the offending IP to the firewall blocklist for 24 hours"
      }
    },
    {
      id: "c5",
      type: "action",
      label: "HTTP request — create incident ticket",
      description: "Creates a tracked security incident in the ticketing system",
      position: { x: 1100, y: 50 },
      config: {
        url: "https://jira.internal/api/issues",
        method: "POST",
        body: "{\"project\": \"SEC\", \"type\": \"Security Incident\", \"priority\": \"High\", \"title\": \"Brute force attempt from {{data.c1.ip}}\", \"description\": \"{{data.c2.body.failed_count}} failed logins in 10 minutes targeting user {{data.c1.user}}\"}",
        description: "Creates a tracked security incident in the ticketing system"
      }
    },
    {
      id: "c6",
      type: "logic",
      label: "Data transform — enrich IP data",
      description: "Extracts the IP field from request",
      position: { x: 1350, y: 50 },
      config: {
        operation: "extract_field",
        source: "{{data.c1}}",
        field_name: "ip",
        description: "Extracts the IP field from request"
      }
    },
    {
      id: "c7",
      type: "output",
      label: "Send email — SOC alert",
      description: "Detailed alert to the security operations center",
      position: { x: 1600, y: 50 },
      config: {
        to: "soc-team@company.co.ke",
        subject: "🔴 SECURITY ALERT: Brute force from {{data.c1.ip}}",
        body_template: "SECURITY ALERT — IMMEDIATE ACTION REQUIRED\n\nIncident Type : Brute Force Attack\nOffending IP  : {{data.c1.ip}}\nFailed Logins : {{data.c2.body.failed_count}} in 10 minutes\nTarget User   : {{data.c1.user}}\nAction Taken  : IP blocked for 24 hours\n\n— ProcessFlow Studio Security Automation",
        description: "Detailed alert to the security operations center"
      }
    },
    {
      id: "c8",
      type: "output",
      label: "Send webhook — Slack SOC channel",
      description: "Instant Slack ping to SOC channel for fastest response",
      position: { x: 1850, y: 50 },
      config: {
        url: "https://hooks.slack.com/services/mock-webhook",
        method: "POST",
        body: "{\"text\": \":red_circle: *Brute force blocked* — IP `{{data.c1.ip}}` made {{data.c2.body.failed_count}} failed attempts on `{{data.c1.user}}`. Blocked 24h.\"}",
        description: "Instant Slack ping to SOC channel for fastest response"
      }
    },
    {
      id: "c9",
      type: "output",
      label: "Log result",
      description: "Audit trail entry for compliance and forensics",
      position: { x: 2100, y: 200 },
      config: {
        message: "Incident response complete. IP {{data.c1.ip}} blocked. Ticket SEC-2847 created. SOC notified via email + Slack.",
        description: "Audit trail entry for compliance and forensics"
      }
    }
  ],
  edges: [
    { id: "ce1", source: "c1", target: "c2" },
    { id: "ce2", source: "c2", target: "c3" },
    { id: "ce3", source: "c3", target: "c4", sourceHandle: "true", label: ">=5 failures — respond" },
    { id: "ce4", source: "c3", target: "c9", sourceHandle: "false", label: "< 5 failures — log only" },
    { id: "ce5", source: "c4", target: "c5" },
    { id: "ce6", source: "c5", target: "c6" },
    { id: "ce7", source: "c6", target: "c7" },
    { id: "ce8", source: "c7", target: "c8" },
    { id: "ce9", source: "c8", target: "c9" }
  ]
};

/**
 * Fetch all workflows owned by the current user
 * Auto-seeds the default templates if the user has 0 workflows.
 */
export async function listWorkflows(): Promise<Workflow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User is not authenticated.');
  }

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const workflows = (data || []) as Workflow[];

  if (workflows.length === 0) {
    // Auto-seed default templates
    const templates = [
      {
        user_id: user.id,
        name: "Finance Fraud Detection & Weekly Report",
        description: "Weekly fraud transaction matching, compliance alerts, and analytics summaries.",
        definition: financeDefinition,
        is_active: true
      },
      {
        user_id: user.id,
        name: "Suspicious Login Detection & Automated Response",
        description: "Cybersecurity login threat analytics, automatic firewall blocking, and Slack operations warning.",
        definition: cyberDefinition,
        is_active: true
      }
    ];

    const { data: seeded, error: seedError } = await supabase
      .from('workflows')
      .insert(templates)
      .select('*');

    if (seedError) {
      console.error('Failed to auto-seed templates:', seedError);
      return [];
    }

    return (seeded || []) as Workflow[];
  }

  return workflows;
}

/**
 * Fetch a single workflow by ID
 */
export async function getWorkflow(id: string): Promise<Workflow> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as Workflow;
}

/**
 * Create a new workflow
 */
export async function createWorkflow(data: WorkflowCreateData): Promise<Workflow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User is not authenticated.');
  }

  const { data: created, error } = await supabase
    .from('workflows')
    .insert({
      user_id: user.id,
      name: data.name,
      description: data.description || null,
      definition: data.definition || { nodes: [], edges: [] },
      is_active: true
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return created as Workflow;
}

/**
 * Update a workflow
 */
export async function updateWorkflow(id: string, data: WorkflowUpdateData): Promise<Workflow> {
  const { data: updated, error } = await supabase
    .from('workflows')
    .update({
      name: data.name,
      description: data.description,
      definition: data.definition,
      is_active: data.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return updated as Workflow;
}

/**
 * Delete a workflow (soft-delete)
 */
export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflows')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
