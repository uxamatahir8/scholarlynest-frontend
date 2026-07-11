'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { logError } from '../../utils/safeLogger';
import MagazineCard from '../magazine/MagazineCard';

export default function MagazineCarousel() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api.get('/magazines/latest')
      .then((response) => {
        if (!active) return;
        setMagazines((response.data?.status === 'success' ? response.data.data : response.data) || []);
      })
      .catch((err) => {
        logError('Failed to load latest magazines:', err);
        if (active) setError('Featured magazines are unavailable right now.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-14">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-center gap-3 px-4 text-sm font-semibold text-[var(--muted)] sm:px-6 lg:px-8">
          <Loader2 className="h-4 w-4 animate-spin text-amber-700" aria-hidden="true" />
          Loading featured magazines...
        </div>
      </section>
    );
  }

  if (error || magazines.length === 0) {
    return null;
  }

  const featured = magazines.slice(0, 4);

  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 lg:py-20" id="featured-magazines">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Featured magazines</p>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Explore research by publication
            </h2>
            <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-350">
              Browse active academic magazines and open their public overview, latest research, and archive pages.
            </p>
          </div>
          <Link href="/magazines" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-300">
            All magazines <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((magazine) => (
            <MagazineCard key={magazine.id} {...magazine} />
          ))}
        </div>
      </div>
    </section>
  );
}
