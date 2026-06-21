'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';

export default function TopAnnounceRibbon({ announcement, onDismiss }) {
  if (!announcement) return null;

  const isArticle = announcement.type === 'article';
  const ctaText = isArticle ? 'Read Article' : 'View Magazine';
  const linkHref = isArticle
    ? `/articles/${announcement.slug}`
    : `/magazines/${announcement.slug}/about-and-overview`;

  const prefixText = isArticle
    ? 'New Research Published'
    : 'Explore Our Latest Magazine';

  return (
    <div
      className="relative z-50 border-b border-zinc-200 bg-zinc-950 text-white dark:border-zinc-850"
      role="status"
      aria-label="Latest announcement"
    >
      <div className="mx-auto flex min-h-10 w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-2 text-xs sm:text-sm">
        {/* Main Content link */}
        <div className="flex-1 flex justify-center items-center gap-2 md:gap-3 text-center">
          <span className="font-bold text-amber-305 text-amber-300 whitespace-nowrap">
            {prefixText}:
          </span>
          <Link
            href={linkHref}
            className="inline-flex min-w-0 items-center gap-1.5 font-medium text-zinc-100 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <span className="truncate max-w-[200px] xs:max-w-[320px] sm:max-w-[500px] md:max-w-[700px]">
              {announcement.title}
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-300 ml-1 hover:text-white shrink-0">
              {ctaText}
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </span>
          </Link>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
