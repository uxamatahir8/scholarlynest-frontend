import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export function ConfirmationModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger', // 'danger' | 'primary' | 'gold'
  isLoading = false
}) {
  // Prevent scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={isLoading ? null : onCancel}
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" 
      />
      
      {/* Modal Content */}
      <div className="relative glass-panel rounded-2xl p-6 shadow-2xl max-w-md w-full border border-[var(--muted-border)] bg-[var(--card-bg)] text-left animate-in zoom-in-95 duration-200 select-none">
        
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            variant === 'danger' 
              ? 'bg-red-500/10 text-red-500' 
              : variant === 'gold' 
                ? 'bg-amber-500/10 text-amber-550' 
                : 'bg-blue-500/10 text-blue-500'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 flex-grow">
            <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)]">{title}</h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-medium">{message}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>

      </div>
    </div>
  );
}
