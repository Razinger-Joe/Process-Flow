'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, Play, Save, Sun, Moon, Loader2, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/store/workflowStore';
import type { NodeStatus } from '@/types/workflow';
import { logout } from '@/lib/api/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


// ============================================================
// Status badge styles
// ============================================================
const statusConfig: Record<
  NodeStatus,
  { label: string; className: string }
> = {
  idle: {
    label: 'Idle',
    className: 'bg-zinc-500/15 text-zinc-400 dark:bg-zinc-500/20',
  },
  running: {
    label: 'Running',
    className:
      'bg-amber-500/15 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse',
  },
  success: {
    label: 'Success',
    className: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  error: {
    label: 'Failed',
    className: 'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  },
};

// ============================================================
// Navbar component
// ============================================================
interface NavbarProps {
  workflowName?: string;
  isEditor?: boolean;
  onRun?: () => void;
  onSave?: () => void;
  onRename?: (name: string) => void;
}

export function Navbar({ workflowName, isEditor = false, onRun, onSave, onRename }: NavbarProps) {
  const theme = useWorkflowStore((s) => s.theme);
  const toggleTheme = useWorkflowStore((s) => s.toggleTheme);
  const runStatus = useWorkflowStore((s) => s.runStatus);

  const isSaving = useWorkflowStore((s) => s.isSaving);
  const lastSavedAt = useWorkflowStore((s) => s.lastSavedAt);

  // Inline‑editable workflow name
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(workflowName ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(workflowName ?? '');
  }, [workflowName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() && onRename) {
      onRename(editValue.trim());
    }
  }, [editValue, onRename]);

  const statusInfo = statusConfig[runStatus];

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* -------------------------------------------------- */}
      {/* LEFT — Logo + workflow name                         */}
      {/* -------------------------------------------------- */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="group flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm shadow-violet-500/25">
            <Zap className="size-4" />
          </div>
          <span className="hidden text-sm font-bold tracking-tight text-foreground sm:inline">
            ProcessFlow
          </span>
        </Link>

        {/* Workflow name (editor only) */}
        {isEditor && workflowName && (
          <>
            <span className="text-muted-foreground/40">/</span>
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') {
                    setEditValue(workflowName);
                    setIsEditing(false);
                  }
                }}
                className="h-7 w-48 text-sm font-medium"
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md px-1.5 py-0.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                title="Click to rename"
              >
                {editValue || workflowName}
              </button>
            )}
          </>
        )}
      </div>

      {/* -------------------------------------------------- */}
      {/* CENTER — Run status (editor only)                   */}
      {/* -------------------------------------------------- */}
      {isEditor && (
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <Badge
            className={cn(
              'pointer-events-auto rounded-full border-0 px-3 py-0.5 text-xs font-semibold',
              statusInfo.className
            )}
          >
            <span
              className={cn(
                'mr-1.5 inline-block size-1.5 rounded-full',
                runStatus === 'idle' && 'bg-zinc-400',
                runStatus === 'running' && 'bg-amber-400',
                runStatus === 'success' && 'bg-emerald-400',
                runStatus === 'error' && 'bg-red-400'
              )}
            />
            {statusInfo.label}
          </Badge>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* RIGHT — Actions                                     */}
      {/* -------------------------------------------------- */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Saving status (editor only) */}
        {isEditor && (
          <div className="hidden text-xs text-muted-foreground mr-2 sm:flex items-center gap-1.5">
            {isSaving ? (
              <span className="flex items-center gap-1 text-violet-400">
                <Loader2 className="size-3 animate-spin" />
                Saving…
              </span>
            ) : lastSavedAt ? (
              <span>Saved at {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>
        )}

        {/* Save (editor only) */}
        {isEditor && onSave && (
          <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
            <Save className="size-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        )}

        {/* Run (editor only) */}
        {isEditor && onRun && (
          <Button
            size="sm"
            onClick={onRun}
            className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            <Play className="size-3.5" />
            <span className="hidden sm:inline">Run</span>
          </Button>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none cursor-pointer rounded-full ml-1 shrink-0">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-violet-600/15 text-xs font-semibold text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                PF
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-muted-foreground">
              <LogOut className="mr-2 size-4" />
              <span>Auth (Disabled)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
