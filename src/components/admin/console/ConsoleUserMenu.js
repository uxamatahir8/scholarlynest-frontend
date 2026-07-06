'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Home, LogOut, Settings, ShieldAlert } from 'lucide-react';

export default function ConsoleUserMenu({ user, onLogout, impersonationActive, onStopImpersonation, stoppingImpersonation }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const initial = user?.name?.charAt(0) || 'U';

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-bold text-[var(--accent)]">{initial}</span>
        <span className="hidden max-w-36 truncate sm:inline">{user?.name || 'Account'}</span>
        <ChevronDown className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-1 shadow-[var(--shadow-lg)]">
          <Link role="menuitem" href="/admin/settings" onClick={() => setOpen(false)} className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
            <Settings className="h-4 w-4" aria-hidden="true" />
            My Account
          </Link>
          <Link role="menuitem" href="/" onClick={() => setOpen(false)} className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
            <Home className="h-4 w-4" aria-hidden="true" />
            Return to Public Site
          </Link>
          {impersonationActive && (
            <button
              role="menuitem"
              type="button"
              disabled={stoppingImpersonation}
              onClick={() => {
                setOpen(false);
                onStopImpersonation();
              }}
              className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-amber-800 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60 dark:text-amber-200 dark:hover:bg-amber-500/10"
            >
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Stop Impersonation
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-red-650 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
