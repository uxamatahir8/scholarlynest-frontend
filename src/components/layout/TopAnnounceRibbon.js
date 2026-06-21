'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import { logWarn } from '../../utils/safeLogger';

export default function TopAnnounceRibbon() {
  const [latestMagazine, setLatestMagazine] = useState(null);

  useEffect(() => {
    let active = true;

    api.get('/public/magazines?per_page=1')
      .then((response) => {
        if (!active) return;
        const magazine = response.data?.data?.[0];
        setLatestMagazine(magazine || null);
      })
      .catch((err) => {
        logWarn('Announcement ribbon unavailable', err.message);
        if (active) setLatestMagazine(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (latestMagazine) document.documentElement.classList.add('has-top-ribbon');
    else document.documentElement.classList.remove('has-top-ribbon');
    return () => document.documentElement.classList.remove('has-top-ribbon');
  }, [latestMagazine]);

  if (!latestMagazine) return null;

  return (
    <div className="relative z-40 border-b border-zinc-200 bg-zinc-950 text-white dark:border-zinc-850" role="status" aria-label="Latest magazine update">
      <div className="mx-auto flex min-h-9 w-full max-w-[1440px] items-center justify-center gap-3 px-4 py-2 text-center text-xs sm:text-sm">
        <span className="font-semibold text-amber-300">Latest magazine</span>
        <Link href={`/magazines/${latestMagazine.slug}/about-and-overview`} className="inline-flex min-w-0 items-center gap-1.5 font-medium text-zinc-100 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-950">
          <span className="truncate">{latestMagazine.title}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
