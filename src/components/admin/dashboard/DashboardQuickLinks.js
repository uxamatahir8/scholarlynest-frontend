import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DashboardQuickLinks({ links = [] }) {
  const visibleLinks = links.filter(Boolean);
  if (!visibleLinks.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="group flex min-h-16 items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <span className="flex min-w-0 items-center gap-3">
              {Icon && <Icon className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />}
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[var(--foreground)]">{link.label}</span>
                {link.description && <span className="mt-1 block text-sm leading-5 text-[var(--muted)]">{link.description}</span>}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}
