'use client';

import { useState, type DragEvent } from 'react';
import {
  Blocks,
  ChevronDown,
  MousePointerClick,
  Clock,
  Webhook,
  Globe,
  Mail,
  Send,
  GitBranch,
  Shuffle,
  Repeat,
  FileText,
  Bell,
  HardDrive,
  type LucideIcon,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { paletteCategories } from '@/lib/mockData';
import type { NodeType } from '@/types/workflow';

// ============================================================
// Icon map — maps string names from mockData to Lucide components
// ============================================================
const iconMap: Record<string, LucideIcon> = {
  MousePointerClick,
  Clock,
  Webhook,
  Globe,
  Mail,
  Send,
  GitBranch,
  Shuffle,
  Repeat,
  FileText,
  Bell,
  HardDrive,
};

// ============================================================
// Color utilities for each node type
// ============================================================
const categoryColors: Record<
  NodeType,
  { dot: string; text: string; bg: string; border: string; hoverBg: string }
> = {
  trigger: {
    dot: 'bg-amber-500',
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    hoverBg: 'hover:bg-amber-500/15',
  },
  action: {
    dot: 'bg-violet-500',
    text: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    hoverBg: 'hover:bg-violet-500/15',
  },
  logic: {
    dot: 'bg-blue-500',
    text: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    hoverBg: 'hover:bg-blue-500/15',
  },
  output: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    hoverBg: 'hover:bg-emerald-500/15',
  },
};

// ============================================================
// NodePalette component
// ============================================================
export function NodePalette() {
  // Track which categories are expanded (all open by default)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(paletteCategories.map((c) => [c.label, true]))
  );

  const toggleCategory = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const onDragStart = (
    event: DragEvent<HTMLDivElement>,
    nodeType: NodeType,
    label: string
  ) => {
    event.dataTransfer.setData('application/processflow-type', nodeType);
    event.dataTransfer.setData('application/processflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3.5">
        <Blocks className="h-5 w-5 text-violet-500" />
        <h2 className="text-sm font-semibold text-foreground">Node Palette</h2>
      </div>

      {/* Scrollable list */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {paletteCategories.map((category, categoryIndex) => {
            const colors = categoryColors[category.type];
            const isOpen = expanded[category.label] ?? true;

            return (
              <div key={category.label}>
                {/* Separator between categories */}
                {categoryIndex > 0 && <Separator className="my-3" />}

                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category.label)}
                  className="mb-2 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-block h-2.5 w-2.5 rounded-full',
                        colors.dot
                      )}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {category.label}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                      !isOpen && '-rotate-90'
                    )}
                  />
                </button>

                {/* Node cards */}
                {isOpen && (
                  <div className="flex flex-col gap-1.5">
                    {category.nodes.map((node) => {
                      const Icon = iconMap[node.icon] ?? Blocks;
                      return (
                        <div
                          key={node.label}
                          draggable
                          onDragStart={(e) =>
                            onDragStart(e, node.type, node.label)
                          }
                          className={cn(
                            'group cursor-grab rounded-lg border px-3 py-2.5 transition-all duration-150 active:cursor-grabbing',
                            colors.border,
                            colors.hoverBg,
                            'hover:border-opacity-50 hover:shadow-sm'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                                colors.bg
                              )}
                            >
                              <Icon className={cn('h-3.5 w-3.5', colors.text)} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium leading-tight text-foreground">
                                {node.label}
                              </p>
                              <p className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-muted-foreground">
                                {node.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}

export default NodePalette;
