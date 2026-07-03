'use client';

import React from 'react';
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../ui/Button';
import { observerRoleLabel } from './deskObserverUtils';

export default function DeskObserverBanner({ observerUser, onChangeUser, onClear }) {
  if (!observerUser) return null;

  return (
    <section
      aria-label="Super Admin review mode"
      className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] p-4 text-sky-950 dark:text-sky-100"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest">Super Admin Review Mode</p>
            <h2 className="mt-1 text-sm font-bold">
              Viewing assigned work for {observerUser.name} — {observerRoleLabel(observerUser.role)}
            </h2>
            <p className="mt-1 text-sm leading-relaxed">
              You are reviewing this user&apos;s assigned desk as Super Admin. Actions for this selected user are disabled.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" icon={RefreshCw} onClick={onChangeUser}>
            Change User
          </Button>
          <Link href="/admin">
            <Button type="button" variant="ghost" size="sm" icon={ArrowLeft} onClick={onClear}>
              Return to My Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
