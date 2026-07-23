'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Dialog({ open, onClose, title, description, children, footer, dismissible = true, className = '', initialFocusRef }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusTarget = initialFocusRef?.current || dialog?.querySelector(focusableSelector) || dialog;
    focusTarget?.focus?.();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible && onClose) onClose();
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus?.();
    };
  }, [open, dismissible, onClose, initialFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-dialog)] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div onClick={dismissible && onClose ? onClose : undefined} className="fixed inset-0 bg-zinc-950/45 backdrop-blur-sm" />
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={`relative w-full max-w-lg transform overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-left shadow-[var(--shadow-lg)] align-middle transition-all outline-none ${className}`}>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
            <div className="text-left">
              {title && <h2 id={titleId} className="font-serif text-lg font-bold tracking-tight text-[var(--foreground)]">{title}</h2>}
              {description && <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{description}</p>}
            </div>
            {dismissible && <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]" aria-label="Close dialog"><X className="h-4 w-4" aria-hidden="true" /></button>}
          </div>
          <div className="px-6 py-5 text-left">{children}</div>
          {footer && <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-muted)] px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
