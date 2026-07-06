'use client';

import React from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function ConsoleImpersonationBanner({ impersonationStatus, onReturn, returning }) {
  if (!impersonationStatus?.active) return null;

  const name = impersonationStatus.impersonated_user?.name || 'another user';

  return (
    <div className="border-b border-amber-300/40 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium leading-5">
            You are viewing the console as <span className="font-bold">{name}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={onReturn}
          disabled={returning}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-amber-600/20 bg-white px-3 text-sm font-bold text-amber-900 shadow-sm transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-950 dark:text-amber-100 dark:hover:bg-zinc-900"
        >
          {returning && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Return to Super Admin
        </button>
      </div>
    </div>
  );
}
