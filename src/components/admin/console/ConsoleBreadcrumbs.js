'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { flattenConsoleNavigation, getConsoleRouteMeta } from './consoleNavigation';

export default function ConsoleBreadcrumbs({ pathname, navigation }) {
  const items = flattenConsoleNavigation(navigation);
  const current = getConsoleRouteMeta(pathname, items);

  if (!pathname || pathname === '/admin') {
    return (
      <nav aria-label="Breadcrumb" className="hidden sm:block">
        <ol className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <li className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
            <Home className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
      <ol className="flex min-w-0 items-center gap-2 text-sm text-[var(--muted)]">
        <li>
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-md font-medium transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
            <Home className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="h-4 w-4" />
        </li>
        <li className="truncate font-semibold text-[var(--foreground)]" aria-current="page">
          {current.title}
        </li>
      </ol>
    </nav>
  );
}
