'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, BookOpenText, CheckCircle2, ChevronDown,
  FileText, GraduationCap, Library, ShieldCheck,
  Users, Layers, Globe, Clock, MessageSquare
} from 'lucide-react';
import api from '../utils/api';
import { logWarn } from '../utils/safeLogger';
import { useAuth } from '../context/AuthContext';
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
  {
    title: '1. Discover or Create',
    description: 'Explore academic magazines or prepare your manuscript.',
    Icon: Library
  },
  {
    title: '2. Submit Your Research',
    description: 'Authors submit work to the appropriate publication.',
    Icon: FileText
  },
  {
    title: '3. Editorial Review',
    description: 'Editors and reviewers guide the manuscript through review.',
    Icon: Clock
  },
  {
    title: '4. Publish and Discover',
    description: 'Published research becomes available for readers worldwide.',
    Icon: BookOpenText
  },
];

const values = [
  'Structured public archives for magazine discovery',
  'Readable article records with persistent scholarly metadata',
  'Contributor workflows separated from public browsing',
];

export default function Home() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState(defaultFaqs);
  const [activeFaq, setActiveFaq] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch FAQ data
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

  // Fetch Live Publishing Counters
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

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <SeoHead
        title="Scholarly Nest - Academic Publishing Platform"
        description="Discover academic magazines, published articles, and public research archives on Scholarly Nest."
        ogUrl="/"
      />

      {/* SECTION 1 — Platform Value and Primary Paths (Hero) */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-white dark:bg-zinc-950">
        <div className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-20">
          <Image src="/main-banner.jpg" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/70 dark:from-zinc-950 dark:via-zinc-950/90 dark:to-zinc-950/70" />
        </div>
        <div className="relative mx-auto grid min-h-[680px] w-full max-w-[1440px] items-center gap-10 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-36">
          <div className="max-w-3xl space-y-7 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              Academic publishing and discovery
            </div>
            <div className="space-y-5">
              <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
                Publish, organize, and discover trusted academic work.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-zinc-650 dark:text-zinc-300 sm:text-lg font-medium">
                Scholarly Nest brings public magazine archives, article discovery, and contributor workflows into one calm, readable publishing experience.
              </p>
            </div>
            <div className="max-w-2xl">
              <GlobalSearchInput placeholder="Search articles, authors, magazines..." />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/magazines"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus:ring-offset-zinc-950 cursor-pointer shadow-md"
              >
                Explore Magazines <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={user ? '/admin/articles/new' : '/login'}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-250 bg-white px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:focus:ring-offset-zinc-950 cursor-pointer shadow-sm"
              >
                Submit Your Research
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto max-w-md rounded-lg border border-zinc-200 bg-white/90 p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950/85">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 text-left">Publishing value</p>
              <ul className="mt-5 space-y-4 text-left">
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

      {/* SECTION 2 — Live Academic Publishing Counters */}
      {stats && (
        <section className="bg-[var(--surface-muted)] py-12 border-b border-[var(--border)] text-zinc-950 dark:text-white">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">

              <div className="flex flex-col items-center p-4">
                <span className="font-serif text-4xl sm:text-5xl font-black text-amber-700 dark:text-amber-305 text-amber-300">
                  {stats.published_articles_count}
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-400 mt-2">
                  Published Articles
                </span>
              </div>

              <div className="flex flex-col items-center p-4">
                <span className="font-serif text-4xl sm:text-5xl font-black text-amber-700 dark:text-amber-305 text-amber-300">
                  {stats.active_magazines_count}
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-400 mt-2">
                  Academic Magazines
                </span>
              </div>

              <div className="flex flex-col items-center p-4">
                <span className="font-serif text-4xl sm:text-5xl font-black text-amber-700 dark:text-amber-305 text-amber-300">
                  {stats.public_contributors_count}
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-400 mt-2">
                  Research Contributors
                </span>
              </div>

              <div className="flex flex-col items-center p-4">
                <span className="font-serif text-4xl sm:text-5xl font-black text-amber-700 dark:text-amber-305 text-amber-300">
                  {stats.published_issues_count}
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-400 mt-2">
                  Published Issues
                </span>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* SECTION 3 — Explore Research by Magazine */}
      <MagazineCarousel />

      {/* SECTION 4 — Latest Published Research */}
      <RecentArticles />

      {/* SECTION 5 — How Scholarly Nest Works */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 lg:py-20 text-left">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Workflow</p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              A clear path from discovery to publication
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ title, description, Icon }) => (
              <article key={title} className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-sm flex flex-col justify-between h-full">
                <div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg w-fit">
                    <Icon className="h-6 w-6 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-zinc-950 dark:text-white leading-snug">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-350">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — For Authors, Editors, and Reviewers */}
      <section className="border-t border-[var(--border)] bg-[var(--background)] py-16 lg:py-20 text-left">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Platform Access</p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Dedicated workflows for all roles
            </h2>
            <p className="text-sm text-zinc-650 dark:text-zinc-350 mt-2 leading-relaxed">
              Scholarly Nest divides public reading layers from secure workspace screens to streamline academic workflows.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {/* Panel 1: Authors */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col justify-between h-full hover:border-amber-500/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 font-mono">
                  <Users className="w-4 h-4" /> Authors
                </div>
                <h3 className="font-serif text-xl font-bold text-zinc-950 dark:text-white">Submit Your Research</h3>
                <p className="text-sm leading-relaxed text-zinc-605 text-zinc-600 dark:text-zinc-350">
                  Register, submit manuscripts to peer-reviewed periodicals, upload supplementary files, and track evaluation in real-time.
                </p>
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Benefit: <span className="text-emerald-600 dark:text-emerald-400">Structured submission track</span>
                </div>
              </div>
              <Link
                href={user ? '/admin/articles/new' : '/login'}
                className="mt-6 inline-flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition-colors cursor-pointer dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Submit Manuscript <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Panel 2: Editors */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col justify-between h-full hover:border-amber-500/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 font-mono">
                  <Layers className="w-4 h-4" /> Editors
                </div>
                <h3 className="font-serif text-xl font-bold text-zinc-950 dark:text-white">Access Workspace</h3>
                <p className="text-sm leading-relaxed text-zinc-605 text-zinc-600 dark:text-zinc-350">
                  Orchestrate review assignments, configure issue release details, write custom guidelines, and manage roles from a single dashboard.
                </p>
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Benefit: <span className="text-emerald-600 dark:text-emerald-400">Comprehensive review panels</span>
                </div>
              </div>
              <Link
                href={user ? '/admin' : '/login'}
                className="mt-6 inline-flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition-colors cursor-pointer dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Access Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Panel 3: Reviewers */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col justify-between h-full hover:border-amber-500/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 font-mono">
                  <ShieldCheck className="w-4 h-4" /> Reviewers
                </div>
                <h3 className="font-serif text-xl font-bold text-zinc-950 dark:text-white">Reviewer Workspace</h3>
                <p className="text-sm leading-relaxed text-zinc-605 text-zinc-600 dark:text-zinc-350">
                  Evaluate assigned articles double-blind, write reviews, and submit evaluations to editors through secure workspace tools.
                </p>
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Benefit: <span className="text-emerald-600 dark:text-emerald-400">Double-blind grading worksheets</span>
                </div>
              </div>
              <Link
                href={user ? '/admin' : '/login'}
                className="mt-6 inline-flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition-colors cursor-pointer dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Reviewer Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 7 — Trust, Open Knowledge, and Community Support */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 lg:py-20 text-left">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">

            <div className="space-y-6">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Scholarly Standards</p>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                A system built for trust and academic integrity
              </h2>
              <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-300">
                Scholarly Nest provides tools designed to promote scientific rigor, audit visibility, and accessibility for open research dissemination.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/magazines" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer">
                  Explore Magazines
                </Link>
                <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-250 bg-white px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 cursor-pointer">
                  Contact Support
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6">

                <div className="flex gap-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--surface-raised)]">
                  <ShieldCheck className="w-8 h-8 text-amber-700 dark:text-amber-300 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-serif text-lg font-bold text-zinc-950 dark:text-white">Peer Review Support</h4>
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-350">
                      Every publication relies on standard peer-review cycles to maintain academic excellence.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--surface-raised)]">
                  <Layers className="w-8 h-8 text-amber-700 dark:text-amber-300 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-serif text-lg font-bold text-zinc-950 dark:text-white">Editorial Workflows</h4>
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-350">
                      Configured roles ensure clear accountability from submission to issue release.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--surface-raised)]">
                  <Globe className="w-8 h-8 text-amber-700 dark:text-amber-300 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-serif text-lg font-bold text-zinc-950 dark:text-white">Accessible Research Discovery</h4>
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-350">
                      Public archives promote open dissemination of scientific and technical advances.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="border-t border-[var(--border)] bg-[var(--background)] py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="text-left">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Questions</p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
            {faqs.slice(0, 6).map((faq, index) => (
              <div key={`${faq.question}-${index}`}>
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-zinc-950 transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 dark:text-white cursor-pointer"
                  aria-expanded={activeFaq === index}
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-550 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {activeFaq === index && (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-350 text-left">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
