import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  className = ''
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible && onClose) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop overlay with blur */}
      <div 
        onClick={dismissible && onClose ? onClose : undefined}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
      />
      
      {/* Modal card container */}
      <div className={`relative w-full max-w-lg rounded-2xl border border-zinc-200/80 bg-white/95 dark:bg-zinc-900/95 shadow-2xl shadow-zinc-950/10 dark:border-zinc-800 backdrop-blur-lg transition-transform duration-300 animate-in zoom-in-95 ${className}`}>
        
        {/* Header bar */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100/80 px-6 py-5 dark:border-zinc-800/60">
          <div className="text-left">
            {title && <h2 className="font-serif text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h2>}
            {description && <p className="mt-1 text-xs leading-relaxed text-zinc-550 dark:text-zinc-400">{description}</p>}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="px-6 py-5 text-left">{children}</div>

        {/* Footer bar */}
        {footer && (
          <div className="border-t border-zinc-100/80 px-6 py-4 dark:border-zinc-800/60 flex items-center justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
