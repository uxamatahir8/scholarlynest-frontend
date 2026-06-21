'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpenText, CheckCircle2, ChevronDown, FileText, GraduationCap, Library } from 'lucide-react';
import api from '../utils/api';
import { logWarn } from '../utils/safeLogger';
import SeoHead from '../components/SeoHead';
import MagazineCarousel from '../components/ui/MagazineCarousel';
import RecentArticles from '../components/ui/RecentArticles';
import GlobalSearchInput from '../components/home/GlobalSearchInput';

const defaultFaqs = [
  {
    question: 'What is Scholarly Nest?',
    answer: 'Scholarly Nest is a public discovery and editorial platform for academic magazines, published articles, and structured research archives.',
  },
  {
    question: 'How do authors submit work?',
    answer: 'Authors can sign in to the contributor console and submit manuscripts through the supported article workflow.',
  },
  {
    question: 'Can readers browse published research?',
    answer: 'Yes. Magazine pages and article records are public wherever publication settings allow public discovery.',
  },
];

const steps = [
  { title: 'Discover magazines', description: 'Browse public magazine archives by title and published article activity.', Icon: Library },
  { title: 'Read published work', description: 'Open article records with authors, publication dates, issue details, DOI, and abstracts where available.', Icon: BookOpenText },
  { title: 'Submit research', description: 'Authors can use the contributor console for manuscript submission and editorial review.', Icon: FileText },
];

const values = [
  'Structured public archives for magazine discovery',
  'Readable article records with persistent scholarly metadata',
  'Contributor workflows separated from public browsing',
];

export default function Home() {
  const [faqs, setFaqs] = useState(defaultFaqs);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/faqs')
      .then((response) => {
        if (active && Array.isArray(response.data) && response.data.length > 0) setFaqs(response.data);
      })
      .catch((err) => logWarn('Public FAQs unavailable', err.message));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <SeoHead
        title="Scholarly Nest - Academic Publishing Platform"
        description="Discover academic magazines, published articles, and public research archives on Scholarly Nest."
        ogUrl="/"
      />

      <section className="relative overflow-hidden border-b border-[var(--border)] bg-white dark:bg-zinc-950">
        <div className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-20">
          <Image src="/main-banner.jpg" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/70 dark:from-zinc-950 dark:via-zinc-950/90 dark:to-zinc-950/70" />
        </div>
        <div className="relative mx-auto grid min-h-[680px] w-full max-w-[1440px] items-center gap-10 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-36">
          <div className="max-w-3xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              Academic publishing and discovery
            </div>
            <div className="space-y-5">
              <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
                Publish, organize, and discover trusted academic work.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-zinc-650 dark:text-zinc-300 sm:text-lg">
                Scholarly Nest brings public magazine archives, article discovery, and contributor workflows into one calm, readable publishing experience.
              </p>
            </div>
            <div className="max-w-2xl">
              <GlobalSearchInput placeholder="Search articles, authors, magazines..." />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/magazines" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus:ring-offset-zinc-950">
                Explore Magazines <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/admin/articles/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-250 bg-white px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:focus:ring-offset-zinc-950">
                Submit Your Research
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto max-w-md rounded-lg border border-zinc-200 bg-white/90 p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950/85">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Publishing value</p>
              <ul className="mt-5 space-y-4">
                {values.map((value) => (
                  <li key={value} className="flex gap-3 text-sm leading-6 text-zinc-650 dark:text-zinc-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <MagazineCarousel />
      <RecentArticles />

      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">How it works</p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">A clear path from discovery to publication</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(({ title, description, Icon }) => (
              <article key={title} className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-sm">
                <Icon className="h-6 w-6 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-bold text-zinc-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-350">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--background)] py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Questions</p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">Frequently asked questions</h2>
          </div>
          <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
            {faqs.slice(0, 6).map((faq, index) => (
              <div key={`${faq.question}-${index}`}>
                <button type="button" onClick={() => setActiveFaq(activeFaq === index ? null : index)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-zinc-950 transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 dark:text-white" aria-expanded={activeFaq === index}>
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {activeFaq === index && (
                  <p className="px-5 pb-5 text-sm leading-7 text-zinc-600 dark:text-zinc-350">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
