'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function TopAnnounceRibbon({ announcement, onDismiss }) {
  if (!announcement) return null;

  const isArticle = announcement.type === 'article';
  const label = isArticle ? 'New research' : 'Latest magazine';
  const action = isArticle ? 'Read article' : 'View magazine';
  const href = isArticle
    ? `/articles/${announcement.slug}`
    : `/magazines/${announcement.slug}/about-and-overview`;

  return (
    <div className="border-b border-zinc-200 bg-zinc-950 text-white dark:border-zinc-850" role="status" aria-label="Site announcement">
      <div className="mx-auto flex min-h-9 w-full max-w-[1440px] items-center gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <span className="hidden shrink-0 font-semibold text-amber-300 sm:inline">{label}</span>
          <Link
            href={href}
            className="inline-flex min-w-0 items-center gap-2 text-zinc-100 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <span className="truncate">{announcement.title}</span>
            <span className="shrink-0 font-semibold text-amber-300">{action}</span>
          </Link>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
