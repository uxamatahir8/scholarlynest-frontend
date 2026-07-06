'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const buildItemHref = (item) => (
  item.type === 'article'
    ? `/articles/${item.slug}`
    : `/magazines/${item.slug}/about-and-overview`
);

export default function TopAnnounceRibbon({ items = [], onDismiss }) {
  const validItems = items.filter((item) => item?.title && item?.slug);
  if (validItems.length === 0) return null;

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 bg-zinc-950 text-white" aria-label="Latest publication headlines">
      <div className="mx-auto flex min-h-10 w-full max-w-[1440px] items-center gap-3 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <p className="hidden shrink-0 text-xs font-bold text-amber-300 sm:block">Latest</p>

        <div className="group min-w-0 flex-1 overflow-hidden focus-within:overflow-x-auto motion-reduce:overflow-x-auto">
          <div className="headline-marquee flex w-max items-center gap-8 pr-8 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:overflow-x-auto">
            <div className="flex items-center gap-8">
              {validItems.map((item, index) => (
                <Link
                  key={`${item.type}-${item.slug}-${index}`}
                  href={buildItemHref(item)}
                  className="inline-flex max-w-[78vw] shrink-0 items-center gap-2 whitespace-nowrap text-zinc-100 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:max-w-md"
                >
                  <span className="font-semibold text-amber-300">
                    {item.type === 'article' ? 'New article:' : 'Now available:'}
                  </span>
                  <span className="truncate">{item.title}</span>
                </Link>
              ))}
            </div>

            {validItems.length > 1 && (
              <div className="flex items-center gap-8 motion-reduce:hidden" aria-hidden="true">
                {validItems.map((item, index) => (
                  <Link
                    key={`duplicate-${item.type}-${item.slug}-${index}`}
                    href={buildItemHref(item)}
                    tabIndex={-1}
                    className="inline-flex max-w-[78vw] shrink-0 items-center gap-2 whitespace-nowrap text-zinc-100 sm:max-w-md"
                  >
                    <span className="font-semibold text-amber-300">
                      {item.type === 'article' ? 'New article:' : 'Now available:'}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
