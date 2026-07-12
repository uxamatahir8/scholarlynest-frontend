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
  const routePrefix = pathname?.startsWith('/journals/') ? 'journals' : 'magazines';
  const slug = params?.slug;
  const isMagazineArticleRoute = Boolean(slug && pathname?.startsWith(`/${routePrefix}/${slug}/articles/`));
  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isMagazineArticleRoute) return;
    if (!slug) return;
    let active = true;

    const fetchShell = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/${routePrefix}/${slug}`);
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
  }, [isMagazineArticleRoute, routePrefix, slug]);

  if (isMagazineArticleRoute) {
    return children;
  }

  if (loading) {
    return <main className="min-h-screen bg-[var(--background)] px-4 pt-32"><LoadingState label="Loading magazine..." /></main>;
  }

  if (error || !magazine) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <ErrorState title="Magazine not available">{error || 'Magazine could not be resolved.'}</ErrorState>
          <Link href={`/${routePrefix}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-300">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to {routePrefix}
          </Link>
        </div>
      </main>
    );
  }

  const navItems = [
    { href: `/${routePrefix}/${slug}/about-and-overview`, label: 'Overview' },
    { href: `/${routePrefix}/${slug}/table-of-contents`, label: 'Table of Contents' },
    ...(magazine.pages || []).map((page) => ({
      href: `/${routePrefix}/${slug}/${page.slug}`,
      label: page.title,
    })),
  ];
  const coverImage = magazine.cover_image_url || getFullImageUrl(magazine.cover_image);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative isolate overflow-hidden bg-zinc-950" aria-labelledby="magazine-title">
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            aria-hidden="true"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-zinc-950/55" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[340px] w-full max-w-[1440px] items-end px-4 py-12 sm:min-h-[380px] sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <Link href={`/${routePrefix}`} className="inline-flex items-center gap-2 text-sm font-bold text-amber-200 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All {routePrefix}
            </Link>
            <h1 id="magazine-title" className="mt-5 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {magazine.title}
            </h1>
            {magazine.description && (
              <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-100 sm:text-lg">
                {magazine.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Publication identity and navigation">
          <div className="hidden lg:block">
            <div className="w-full max-w-[190px] overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
              {coverImage ? (
                <img src={coverImage} alt={`${magazine.title} cover`} className="aspect-[3/4] w-full object-cover" />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                  <BookOpen className="h-8 w-8 text-zinc-400" aria-hidden="true" />
                </div>
              )}
            </div>
            <h2 className="mt-5 font-serif text-2xl font-bold leading-tight text-zinc-950 dark:text-white">{magazine.title}</h2>
          </div>

          <nav className="mt-6 flex gap-3 overflow-x-auto border-y border-[var(--border)] py-3 lg:block lg:space-y-1 lg:overflow-visible lg:border-y-0 lg:py-0" aria-label="Magazine sections">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:flex lg:w-full ${
                  active
                    ? 'bg-[var(--surface-muted)] text-zinc-950 shadow-[inset_3px_0_0_rgba(180,83,9,0.8)] dark:text-white'
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
