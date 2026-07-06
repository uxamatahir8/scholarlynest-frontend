'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, TriangleAlert } from 'lucide-react';

const ToastContext = createContext(null);

const toastMeta = {
  success: ['Operation successful', CheckCircle2, 'text-emerald-600'],
  error: ['Action needed', AlertCircle, 'text-red-600'],
  warning: ['Please review', TriangleAlert, 'text-amber-600'],
  info: ['Notice', Info, 'text-blue-600'],
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const safeType = toastMeta[type] ? type : 'info';
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type: safeType }]);
    window.setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed right-4 top-6 z-[var(--z-toast)] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const [label, Icon, iconClass] = toastMeta[t.type] || toastMeta.info;
          return (
            <div key={t.id} role={t.type === 'error' || t.type === 'warning' ? 'alert' : 'status'} className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-md)] backdrop-blur-md">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} aria-hidden="true" />
              <div className="min-w-0 flex-grow">
                <span className="text-xs font-bold text-[var(--muted)]">{label}</span>
                <p className="text-sm font-medium leading-relaxed text-[var(--foreground)]">{t.message}</p>
              </div>
              <button onClick={() => removeToast(t.id)} className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]" aria-label="Dismiss notification"><X className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
