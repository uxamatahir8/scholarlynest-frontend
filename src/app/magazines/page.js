'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import api from '../../utils/api';
import { logWarn } from '../../utils/safeLogger';
import MagazineCard from '../../components/magazine/MagazineCard';
import Pagination from '../../components/ui/Pagination';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

export default function MagazinesRegistry() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let active = true;

    const fetchMagazines = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/magazines', { params: { page, per_page: 8 } });
        if (!active) return;
        setMagazines(response.data?.data || []);
        setTotalPages(response.data?.last_page || 1);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        logWarn('Public magazine registry unavailable', err.message);
        if (active) setError('We were unable to load the magazine registry at this time.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMagazines();
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <main className="min-h-screen bg-[var(--background)] pb-16 pt-16">
      <title>Magazines - ScholarlyNest</title>
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <header className="grid gap-6 border-b border-[var(--border)] pb-10 lg:grid-cols-[0.58fr_0.42fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Magazine discovery</p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-zinc-950 dark:text-white sm:text-5xl">
              Browse the publication catalogue.
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-8 text-zinc-650 dark:text-zinc-300">
            Explore public academic magazines, review their overview pages, and open published table-of-contents archives.
          </p>
        </header>

        <section className="mt-12" aria-label="Magazine collection">
          {loading && <LoadingState label="Loading magazines..." className="min-h-[280px]" />}

          {!loading && error && (
            <ErrorState title="Magazines could not be loaded">{error}</ErrorState>
          )}

          {!loading && !error && magazines.length === 0 && (
            <EmptyState icon={BookOpen} title="No magazines are published yet">
              Public magazines will appear here after they are available for discovery.
            </EmptyState>
          )}

          {!loading && !error && magazines.length > 0 && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {magazines.map((magazine) => <MagazineCard key={magazine.id} {...magazine} />)}
            </div>
          )}
        </section>

        {!loading && !error && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </main>
  );
}
