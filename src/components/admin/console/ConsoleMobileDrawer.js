'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { ConsoleNavigationList } from './ConsoleSidebar';

const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ConsoleMobileDrawer({ open, onClose, navigation, pathname, triggerRef }) {
  const drawerRef = useRef(null);
  const closeRef = useRef(null);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (!open) return undefined;

    const focusTarget = closeRef.current || drawerRef.current;
    focusTarget?.focus?.();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusable = Array.from(drawerRef.current.querySelectorAll(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        drawerRef.current.focus();
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
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      triggerRef?.current?.focus?.();
    };
  }, [open, onClose, triggerRef]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      if (open) onClose();
    }
  }, [open, onClose, pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-dialog)] lg:hidden">
      <div className="absolute inset-0 bg-zinc-950/45" aria-hidden="true" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="console-mobile-drawer-title"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-[min(22rem,calc(100vw-2rem))] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] outline-none"
      >
        <div className="flex min-h-[var(--console-topbar-height)] items-center justify-between border-b border-[var(--border)] px-5">
          <h2 id="console-mobile-drawer-title" className="text-sm font-bold text-[var(--foreground)]">Console navigation</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            aria-label="Close console navigation"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="console-scroll flex-1 overflow-y-auto px-3 py-5">
          <ConsoleNavigationList navigation={navigation} pathname={pathname} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
