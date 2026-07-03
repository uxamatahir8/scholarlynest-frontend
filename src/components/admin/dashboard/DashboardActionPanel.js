import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DashboardActionPanel({ eyebrow, title, description, href, label }) {
  return (
    <section className="border-b border-[var(--border)] pb-6" aria-labelledby="dashboard-primary-action">
      <div className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-bold text-[var(--muted)]">{eyebrow}</p>}
          <h2 id="dashboard-primary-action" className="mt-1 text-lg font-bold text-[var(--foreground)]">{title}</h2>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
        </div>
        {href && label && (
          <Link href={href} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-bold text-[var(--primary-foreground)] transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
            {label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}
