'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

// ─── Module-level event bus ─────────────────────────────
type Listener = (message: string, type: ToastType) => void;
const listeners = new Set<Listener>();
let nextId = 0;

export function showToast(message: string, type: ToastType = 'info') {
  listeners.forEach(fn => fn(message, type));
}

// ─── Toast Container (mount once in layout) ─────────────
export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    setMounted(true);
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  const dismiss = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (!mounted || toasts.length === 0) return null;

  const iconMap: Record<ToastType, string> = {
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  const colorMap: Record<ToastType, string> = {
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
  };

  return createPortal(
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto w-full rounded-xl border backdrop-blur-md px-4 py-3
            flex items-start gap-3 shadow-2xl animate-[slideDown_0.25s_ease-out]
            ${colorMap[toast.type]}
          `}
          onClick={() => dismiss(toast.id)}
        >
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconMap[toast.type]} />
          </svg>
          <p className="text-sm font-medium text-white leading-snug">{toast.message}</p>
        </div>
      ))}
    </div>,
    document.body
  );
}
