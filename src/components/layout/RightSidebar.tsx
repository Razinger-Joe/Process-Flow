'use client';

import { useCallback, useMemo } from 'react';
import {
  X,
  MousePointer2,
  Trash2,
  Clock,
  Globe,
  Send,
  GitBranch,
  Zap,
} from 'lucide-react';
import type { NodeType, WorkflowNode } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================
// Node-type metadata: badge colors and icons
// ============================================================
const nodeTypeMeta: Record<
  NodeType,
  { label: string; colorClass: string; bgClass: string; icon: React.ReactNode }
> = {
  trigger: {
    label: 'Trigger',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: <Zap className="size-3" />,
  },
  action: {
    label: 'Action',
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    icon: <Send className="size-3" />,
  },
  logic: {
    label: 'Logic',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: <GitBranch className="size-3" />,
  },
  output: {
    label: 'Output',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: <Globe className="size-3" />,
  },
};

// ============================================================
// Type-specific config field definitions
// ============================================================
interface ConfigFieldDef {
  key: string;
  label: string;
  type: 'input' | 'textarea' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const configFieldsByType: Record<NodeType, ConfigFieldDef[]> = {
  trigger: [
    {
      key: 'schedule',
      label: 'Schedule / Cron',
      type: 'input',
      placeholder: '*/5 * * * *',
    },
    {
      key: 'timezone',
      label: 'Timezone',
      type: 'select',
      options: [
        { value: 'UTC', label: 'UTC' },
        { value: 'America/New_York', label: 'America / New York' },
        { value: 'America/Chicago', label: 'America / Chicago' },
        { value: 'America/Denver', label: 'America / Denver' },
        { value: 'America/Los_Angeles', label: 'America / Los Angeles' },
        { value: 'Europe/London', label: 'Europe / London' },
        { value: 'Europe/Berlin', label: 'Europe / Berlin' },
        { value: 'Asia/Tokyo', label: 'Asia / Tokyo' },
        { value: 'Asia/Shanghai', label: 'Asia / Shanghai' },
        { value: 'Australia/Sydney', label: 'Australia / Sydney' },
      ],
    },
  ],
  action: [
    {
      key: 'method',
      label: 'HTTP Method',
      type: 'select',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' },
        { value: 'DELETE', label: 'DELETE' },
      ],
    },
    {
      key: 'url',
      label: 'URL',
      type: 'input',
      placeholder: 'https://api.example.com/endpoint',
    },
    {
      key: 'headers',
      label: 'Headers (JSON)',
      type: 'textarea',
      placeholder: '{\n  "Content-Type": "application/json"\n}',
    },
  ],
  logic: [
    {
      key: 'field',
      label: 'Field',
      type: 'input',
      placeholder: 'response.status',
    },
    {
      key: 'operator',
      label: 'Operator',
      type: 'select',
      options: [
        { value: 'equals', label: 'Equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'greater_than', label: 'Greater Than' },
        { value: 'less_than', label: 'Less Than' },
      ],
    },
    {
      key: 'value',
      label: 'Value',
      type: 'input',
      placeholder: '200',
    },
  ],
  output: [
    {
      key: 'to',
      label: 'Recipient',
      type: 'input',
      placeholder: 'user@example.com',
    },
    {
      key: 'subject',
      label: 'Subject',
      type: 'input',
      placeholder: 'Workflow notification',
    },
    {
      key: 'body',
      label: 'Body',
      type: 'textarea',
      placeholder: 'Enter the message body…',
    },
  ],
};

// ============================================================
// ConfigField — renders a single config field
// ============================================================
function ConfigField({
  field,
  value,
  onChange,
}: {
  field: ConfigFieldDef;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  if (field.type === 'select' && field.options) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{field.label}</Label>
        <Select value={value || field.options[0]?.value || ''} onValueChange={(v) => onChange(field.key, v ?? '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}…`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{field.label}</Label>
        <Textarea
          value={value || ''}
          placeholder={field.placeholder}
          className="min-h-[80px] resize-none text-sm"
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{field.label}</Label>
      <Input
        value={value || ''}
        placeholder={field.placeholder}
        className="text-sm"
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    </div>
  );
}

// ============================================================
// NodeConfigPanel — the node editing panel body
// ============================================================
function NodeConfigPanel({ node }: { node: WorkflowNode }) {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);

  const meta = nodeTypeMeta[node.type];
  const fields = configFieldsByType[node.type];

  const handleConfigChange = useCallback(
    (key: string, value: string) => {
      updateNode(node.id, {
        config: { ...node.config, [key]: value },
      });
    },
    [node.id, node.config, updateNode]
  );

  const handleDelete = useCallback(() => {
    deleteNode(node.id);
  }, [node.id, deleteNode]);

  return (
    <div className="flex h-full flex-col">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn('gap-1 border font-medium', meta.bgClass)}
          >
            {meta.icon}
            {meta.label}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSelectedNodeId(null)}
          aria-label="Close panel"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* ---- Scrollable body ---- */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Node name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Node Name</Label>
            <Input
              value={node.label}
              className="text-sm font-medium"
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
            />
          </div>

          <Separator />

          {/* Type-specific config */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className={cn('size-3.5', meta.colorClass)} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Configuration
              </span>
            </div>
            {fields.map((field) => (
              <ConfigField
                key={field.key}
                field={field}
                value={node.config[field.key] ?? ''}
                onChange={handleConfigChange}
              />
            ))}
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={node.description ?? ''}
              placeholder="Add a description for this node…"
              className="min-h-[64px] resize-none text-sm"
              onChange={(e) =>
                updateNode(node.id, { description: e.target.value })
              }
            />
          </div>
        </div>
      </ScrollArea>

      {/* ---- Footer: Delete button ---- */}
      <div className="border-t border-border p-4">
        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={handleDelete}
        >
          <Trash2 className="size-4" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// RightSidebar — main export
// ============================================================
export function RightSidebar() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const workflow = useWorkflowStore((s) => s.workflow);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !workflow) return null;
    return workflow.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, workflow]);

  const isOpen = selectedNode !== null;

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-l border-border bg-card transition-all duration-300 ease-in-out',
        isOpen ? 'w-[300px] opacity-100' : 'w-0 overflow-hidden opacity-0'
      )}
    >
      {selectedNode ? (
        <NodeConfigPanel node={selectedNode} />
      ) : (
        <EmptyState />
      )}
    </aside>
  );
}

// ============================================================
// Empty state — shown when no node is selected
// ============================================================
function EmptyState() {
  return (
    <div className="flex h-full w-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted/50">
        <MousePointer2 className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Select a node
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Click on a node in the canvas to view and edit its configuration.
        </p>
      </div>
    </div>
  );
}
