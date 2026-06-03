'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Render Portal Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start space-x-3.5 p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_10px_30px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-5 duration-300 transition-all"
          >
            {t.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            {t.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            {t.type === 'info' && (
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            )}
            
            <div className="flex-grow flex flex-col space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                {t.type === 'success' ? 'Operation Success' : t.type === 'error' ? 'Operation Failure' : 'System Notice'}
              </span>
              <p className="text-xs font-semibold text-[var(--foreground)] leading-relaxed">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 mt-0.5"
              aria-label="Dismiss Notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
