'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { logWarn } from '../utils/safeLogger';
import { useAuth } from '../context/AuthContext';
import SeoHead from '../components/SeoHead';
import MagazineCarousel from '../components/ui/MagazineCarousel';
import RecentArticles from '../components/ui/RecentArticles';
import GlobalSearchInput from '../components/home/GlobalSearchInput';

const WORKFLOW_STEPS = [
  ['Discover', 'Browse magazines and published research by topic, publication, or author.'],
  ['Submit', 'Authors prepare their research and begin the supported submission path.'],
  ['Review', 'Editors and reviewers continue their work inside the secure console.'],
  ['Publish', 'Approved research becomes available in public magazine archives.'],
];

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;

    api.get('/public/homepage-stats')
      .then((response) => {
        if (active && response.data) setStats(response.data);
      })
      .catch((err) => logWarn('Homepage stats unavailable', err.message));

    return () => {
      active = false;
    };
  }, []);

  const counters = useMemo(() => {
    if (!stats) return [];

    return [
      ['Published Articles', stats.published_articles_count],
      ['Academic Magazines', stats.active_magazines_count],
      ['Research Contributors', stats.public_contributors_count],
      ['Published Issues', stats.published_issues_count],
    ].filter(([, value]) => Number.isFinite(Number(value)));
  }, [stats]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <SeoHead
        title="Scholarly Nest - Academic Publishing Platform"
        description="Discover academic magazines, published articles, and public research archives on Scholarly Nest."
        ogUrl="/"
      />

      <section className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_0.65fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-base font-semibold text-amber-700 dark:text-amber-300">Academic publishing and discovery</p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
              A quieter home for published research.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-650 dark:text-zinc-300">
              Scholarly Nest helps readers explore academic magazines, authors submit research, and editorial teams maintain public publication archives.
            </p>
            <div className="mt-8 max-w-2xl">
              <GlobalSearchInput placeholder="Search articles, authors, magazines..." />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/magazines" className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                Explore Magazines
              </Link>
              <Link href={user ? '/admin/articles/new' : '/login'} className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-250 px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-750 dark:text-zinc-100 dark:hover:bg-zinc-900">
                Submit Research
              </Link>
            </div>
          </div>

          <aside className="self-end border-l-0 border-zinc-200 pt-2 dark:border-zinc-800 lg:border-l lg:pl-8">
            <p className="font-serif text-2xl font-bold leading-snug text-zinc-950 dark:text-white">
              Research-first navigation for readers, contributors, editors, and reviewers.
            </p>
            <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-350">
              Public discovery stays separate from secure workflow tools, so visitors see only published research and public magazine information.
            </p>
          </aside>
        </div>
      </section>

      {counters.length > 0 && (
        <section className="border-b border-[var(--border)] bg-[var(--surface)] py-8">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {counters.map(([label, value]) => (
              <div key={label} className="py-4 md:py-5">
                <p className="font-serif text-3xl font-bold text-zinc-950 dark:text-white">{Number(value).toLocaleString()}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-350">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <MagazineCarousel />
      <RecentArticles />

      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.38fr_0.62fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">How it works</p>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              From discovery to publication
            </h2>
          </div>
          <ol className="grid gap-6 sm:grid-cols-2">
            {WORKFLOW_STEPS.map(([title, description], index) => (
              <li key={title} className="border-t border-[var(--border)] pt-4">
                <p className="text-sm font-semibold text-zinc-500">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-bold text-zinc-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-350">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--background)] py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.7fr_0.3fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Publish with Scholarly Nest</p>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              One clear contributor path.
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-650 dark:text-zinc-300">
              Authors can submit research through the contributor workspace. Editors and reviewers can sign in to continue assigned publication work inside the secure console.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-3 sm:flex-row lg:flex-col">
            <Link href={user ? '/admin/articles/new' : '/login'} className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
              Submit Research
            </Link>
            <Link href="/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-zinc-250 px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-750 dark:text-zinc-100 dark:hover:bg-zinc-900">
              Sign in to Workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
