'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

type ToastListener = (toast: Toast) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  success: (message: string, title?: string) => {
    emit({ id: Math.random().toString(), message, title, type: 'success' });
  },
  error: (message: string, title?: string) => {
    emit({ id: Math.random().toString(), message, title, type: 'error' });
  },
  warning: (message: string, title?: string) => {
    emit({ id: Math.random().toString(), message, title, type: 'warning' });
  },
  info: (message: string, title?: string) => {
    emit({ id: Math.random().toString(), message, title, type: 'info' });
  },
};

function emit(toast: Toast) {
  listeners.forEach((listener) => listener(toast));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (newToast: Toast) => {
      setToasts((prev) => [...prev, newToast]);
      
      const duration = newToast.duration || 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, duration);
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => {
        let Icon = Info;
        let iconColor = 'text-blue-500';
        let bgBorder = 'bg-slate-900/90 border-blue-500/20';

        if (t.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'text-emerald-500';
          bgBorder = 'bg-emerald-950/40 border-emerald-500/20';
        } else if (t.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'text-rose-500';
          bgBorder = 'bg-rose-950/40 border-rose-500/20';
        } else if (t.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-500';
          bgBorder = 'bg-amber-950/40 border-amber-500/20';
        }

        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-2 ${bgBorder}`}
          >
            <Icon className={`size-5 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              {t.title && (
                <h4 className="text-sm font-semibold text-white leading-none mb-1">
                  {t.title}
                </h4>
              )}
              <p className="text-xs text-slate-300 leading-normal">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white shrink-0 rounded-lg p-0.5 hover:bg-white/5 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
