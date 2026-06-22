'use client';

import React, { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import api from '../../../utils/api';
import { logWarn } from '../../../utils/safeLogger';
import LoadingState from '../../../components/ui/LoadingState';
import ErrorState from '../../../components/ui/ErrorState';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  if (path.startsWith('/images/') || path.startsWith('images/')) return path.startsWith('/') ? path : `/${path}`;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}${cleanPath}`;
};

export default function MagazinePublicLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const slug = params?.slug;
  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    const fetchShell = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/magazines/${slug}`);
        if (active) setMagazine(response.data);
      } catch (err) {
        logWarn('Magazine shell unavailable', err.message);
        if (active) setError('The requested magazine could not be found.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchShell();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return <main className="min-h-screen bg-[var(--background)] px-4 pt-32"><LoadingState label="Loading magazine..." /></main>;
  }

  if (error || !magazine) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <ErrorState title="Magazine not available">{error || 'Magazine could not be resolved.'}</ErrorState>
          <Link href="/magazines" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-300">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to magazines
          </Link>
        </div>
      </main>
    );
  }

  const navItems = [
    { href: `/magazines/${slug}/about-and-overview`, label: 'Overview' },
    { href: `/magazines/${slug}/table-of-contents`, label: 'Table of Contents / Archive' },
    ...(magazine.pages || []).map((page) => ({
      href: `/magazines/${slug}/${page.slug}`,
      label: page.title,
    })),
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Publication identity and navigation">
          <div className="grid gap-5 sm:grid-cols-[120px_1fr] lg:block">
            <div className="w-32 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900 sm:w-full lg:max-w-[220px]">
            {magazine.cover_image ? (
              <img src={getFullImageUrl(magazine.cover_image)} alt={`${magazine.title} cover`} className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <BookOpen className="h-8 w-8 text-zinc-400" aria-hidden="true" />
              </div>
            )}
            </div>

            <div className="min-w-0 lg:mt-6">
            <Link href="/magazines" className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-300">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All magazines
            </Link>
              <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-zinc-950 dark:text-white">{magazine.title}</h1>
            {magazine.description && (
                <p className="mt-3 line-clamp-5 text-sm leading-7 text-zinc-650 dark:text-zinc-300">{magazine.description}</p>
            )}
            </div>
          </div>

          <nav className="mt-6 flex gap-3 overflow-x-auto border-y border-[var(--border)] py-3 lg:block lg:space-y-1 lg:overflow-visible lg:border-y-0 lg:py-0" aria-label="Magazine sections">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:flex lg:w-full ${
                  active
                    ? 'bg-[var(--surface-muted)] text-zinc-950 underline decoration-amber-600 decoration-2 underline-offset-8 dark:text-white'
                    : 'text-zinc-600 hover:bg-[var(--surface-muted)] hover:text-zinc-950 dark:text-zinc-350 dark:hover:text-white'
                }`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
