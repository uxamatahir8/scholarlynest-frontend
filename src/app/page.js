'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import { logWarn } from '../utils/safeLogger';
import { useAuth } from '../context/AuthContext';
import SeoHead from '../components/SeoHead';
import MagazineCarousel from '../components/ui/MagazineCarousel';
import JournalCarousel from '../components/ui/JournalCarousel';
import RecentArticles from '../components/ui/RecentArticles';
import GlobalSearchInput from '../components/home/GlobalSearchInput';
import AdvertisementSlot from '../components/advertising/AdvertisementSlot';

const WORKFLOW_STEPS = [
  ['Discover', 'Browse magazines and published research by topic, publication, or author.'],
  ['Submit', 'Authors prepare their research and begin the supported submission path.'],
  ['Review', 'Editors and reviewers continue their work inside the secure console.'],
  ['Publish', 'Approved research becomes available in public magazine archives.'],
];

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  if (path.startsWith('/images/') || path.startsWith('images/')) return path.startsWith('/') ? path : `/${path}`;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}${cleanPath}`;
};

const issueLabel = (issue) => {
  if (!issue) return '';
  const parts = [];
  if (issue.volume_number) parts.push(`Volume ${issue.volume_number}`);
  if (issue.issue_number) parts.push(`Issue ${issue.issue_number}`);
  if (issue.issue_month || issue.issue_year) parts.push([issue.issue_month, issue.issue_year].filter(Boolean).join(' '));
  return parts.join(' - ');
};

function FaqSection({ faqs = [], loading = false }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="border-t border-[var(--border)] bg-[var(--background)] py-16 lg:py-20">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.36fr_0.64fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Questions</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white sm:text-4xl">
            Practical answers for public readers and contributors
          </h2>
        </div>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {loading && (
            <div className="py-8 text-sm text-zinc-500 dark:text-zinc-400">Loading questions...</div>
          )}

          {!loading && faqs.length === 0 && (
            <div className="py-8 text-sm leading-7 text-zinc-600 dark:text-zinc-350">
              No public FAQs are published right now.
            </div>
          )}

          {!loading && faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `homepage-faq-${index}`;
            return (
              <div key={faq.id || faq.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className={`flex w-full items-center justify-between gap-4 py-5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${isOpen ? 'bg-[var(--surface-muted)]/45 px-3 sm:px-4' : ''}`}
                >
                  <span className="font-serif text-xl font-bold text-zinc-950 dark:text-white">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <div id={panelId} hidden={!isOpen} className="pb-5 text-sm leading-7 text-zinc-600 dark:text-zinc-350">
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);
  const [latestMagazines, setLatestMagazines] = useState([]);
  const [latestJournals, setLatestJournals] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      api.get('/public/homepage-stats'),
      api.get('/articles/latest', { params: { limit: 10 } }),
      api.get('/public/magazines', { params: { per_page: 5 } }),
      api.get('/public/journals', { params: { per_page: 5 } }),
      api.get('/public/faqs'),
    ]).then(([statsResult, articlesResult, magazinesResult, journalsResult, faqResult]) => {
      if (!active) return;

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data);
      } else {
        logWarn('Homepage stats unavailable', statsResult.reason?.message);
      }

      if (articlesResult.status === 'fulfilled') {
        const articles = articlesResult.value.data?.status === 'success'
          ? articlesResult.value.data.data
          : articlesResult.value.data?.data;
        setLatestArticles(Array.isArray(articles) ? articles : []);
      } else {
        logWarn('Homepage latest articles unavailable', articlesResult.reason?.message);
      }

      if (magazinesResult.status === 'fulfilled') {
        const magazines = magazinesResult.value.data?.data;
        setLatestMagazines(Array.isArray(magazines) ? magazines : []);
      } else {
        logWarn('Homepage magazines unavailable', magazinesResult.reason?.message);
      }

      if (journalsResult.status === 'fulfilled') {
        const journals = journalsResult.value.data?.data;
        setLatestJournals(Array.isArray(journals) ? journals : []);
      } else {
        logWarn('Homepage journals unavailable', journalsResult.reason?.message);
      }

      if (faqResult.status === 'fulfilled') {
        setFaqs(Array.isArray(faqResult.value.data?.data) ? faqResult.value.data.data : []);
      } else {
        logWarn('Homepage FAQs unavailable', faqResult.reason?.message);
      }
      setFaqsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const counters = useMemo(() => {
    if (!stats) return [];

    return [
      ['Published Articles', stats.published_articles_count],
      ['Academic Magazines', stats.active_magazines_count],
      ['Academic Journals', stats.active_journals_count],
      ['Research Contributors', stats.public_contributors_count],
      ['Published Issues', stats.published_issues_count],
    ].filter(([, value]) => Number.isFinite(Number(value)));
  }, [stats]);

  const currentIssueArticle = useMemo(() => (
    latestArticles.find((article) => article.issue && article.magazine)
  ), [latestArticles]);
  const submitHref = user ? '/admin/articles/new' : '/login';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <SeoHead
        title="ScholarlyNest - Academic Publishing Platform"
        description="Discover academic magazines, published articles, and public research archives on ScholarlyNest."
        ogUrl="/"
      />
      <AdvertisementSlot placement="content_top" context={{ context: 'website', page_key: 'home' }} className="mx-auto max-w-[1440px] px-4 py-6" />

      <section className="relative isolate overflow-hidden bg-zinc-950">
        <div
          className="absolute inset-0 bg-cover bg-center sm:bg-[center_42%]"
          style={{ backgroundImage: "url('/main-banner.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-zinc-950/45 dark:bg-zinc-950/50" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[520px] w-full max-w-[1440px] content-end gap-10 px-4 py-14 sm:min-h-[560px] sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_0.65fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-base font-semibold text-amber-200">Academic publishing and discovery</p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              A quieter home for published research.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-100">
              ScholarlyNest helps readers explore academic magazines, authors submit research, and editorial teams maintain public publication archives.
            </p>
            <div className="mt-8 max-w-2xl">
              <GlobalSearchInput placeholder="Search articles, authors, magazines..." />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/magazines" className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-300">
                Explore Magazines
              </Link>
              <Link href={submitHref} className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950/60 px-5 text-sm font-bold text-white ring-1 ring-white/35 transition-colors hover:bg-zinc-950/80 focus:outline-none focus:ring-2 focus:ring-amber-300">
                Submit Research
              </Link>
            </div>
          </div>

          <aside className="self-end pt-2 lg:pl-8">
            <p className="font-serif text-2xl font-bold leading-snug text-white">
              Research-first navigation for readers, contributors, editors, and reviewers.
            </p>
            <p className="mt-4 text-base leading-7 text-zinc-100">
              Public discovery stays separate from secure workflow tools, so visitors see only published research and public magazine information.
            </p>
          </aside>
        </div>
      </section>

      {counters.length > 0 && (
        <section className="border-b border-[var(--border)] bg-[var(--surface)] py-8">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-5 lg:px-8">
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
      <RecentArticles publicationType="magazine" />
      <JournalCarousel />
      <RecentArticles publicationType="journal" />

      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.34fr_0.66fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Browse by subject</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white sm:text-4xl">
              Start with the magazine that fits your field
            </h2>
            <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-350">
              Public subject taxonomies are not exposed as a separate homepage API, so this section points readers to magazine discovery instead of hardcoded disciplines.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {latestMagazines.slice(0, 4).map((magazine) => (
              <Link
                key={magazine.id || magazine.slug}
                href={`/magazines/${magazine.slug}/about-and-overview`}
                className="group border-t border-[var(--border)] pt-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <span className="font-serif text-xl font-bold text-zinc-950 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">{magazine.title}</span>
                <span className="mt-2 block text-sm leading-6 text-zinc-600 dark:text-zinc-350">{magazine.description || 'Open the public overview and archive for this magazine.'}</span>
              </Link>
            ))}
            <Link href="/magazines" className="group border-t border-[var(--border)] pt-4 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <span className="font-serif text-xl font-bold text-zinc-950 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">All academic magazines</span>
              <span className="mt-2 block text-sm leading-6 text-zinc-600 dark:text-zinc-350">Browse the complete public magazine directory.</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.34fr_0.66fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Browse by subject</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white sm:text-4xl">
              Start with the journal that fits your field
            </h2>
            <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-350">
              Public subject taxonomies are not exposed as a separate homepage API, so this section points readers to journal discovery instead of hardcoded disciplines.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {latestJournals.slice(0, 4).map((journal) => (
              <Link
                key={journal.id || journal.slug}
                href={`/journals/${journal.slug}/about-and-overview`}
                className="group border-t border-[var(--border)] pt-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <span className="font-serif text-xl font-bold text-zinc-950 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">{journal.title}</span>
                <span className="mt-2 block text-sm leading-6 text-zinc-600 dark:text-zinc-350">{journal.description || 'Open the public overview and archive for this journal.'}</span>
              </Link>
            ))}
            <Link href="/journals" className="group border-t border-[var(--border)] pt-4 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <span className="font-serif text-xl font-bold text-zinc-950 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">All academic journals</span>
              <span className="mt-2 block text-sm leading-6 text-zinc-600 dark:text-zinc-350">Browse the complete public journal directory.</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--background)] py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.42fr_0.58fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Current issue spotlight</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white sm:text-4xl">
              Recently published issue context
            </h2>
          </div>
          {currentIssueArticle ? (
            <article className="grid gap-5 sm:grid-cols-[160px_1fr]">
              <div className="aspect-[4/3] overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
                {(currentIssueArticle.magazine?.cover_image_url || currentIssueArticle.magazine?.cover_image) ? (
                  <img src={currentIssueArticle.magazine.cover_image_url || getFullImageUrl(currentIssueArticle.magazine.cover_image)} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-8 w-8 text-zinc-400" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-zinc-950 dark:text-white">{currentIssueArticle.magazine.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-350">
                  {[issueLabel(currentIssueArticle.issue), currentIssueArticle.issue?.special_title].filter(Boolean).join(' - ') || 'Published issue'}
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-350">
                  Highlighted from the latest public article assigned to a published issue: {currentIssueArticle.title}
                </p>
                <Link href={`/magazines/${currentIssueArticle.magazine.slug}/table-of-contents`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                  Browse This Issue
                </Link>
              </div>
            </article>
          ) : (
            <div className="border-y border-[var(--border)] py-6">
              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-350">
                No public issue assignment is available from the latest published articles right now. Magazine archives remain available from the public directory.
              </p>
              <Link href="/magazines" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-300">
                Browse magazine archives <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.38fr_0.62fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Editorial standards</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white sm:text-4xl">
              Public publishing values without private workflow details
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              ['Published-only discovery', 'Homepage research sections use public article and magazine endpoints.'],
              ['Separated workflow', 'Editorial review and assignment tools remain inside the secure console.'],
              ['Publication context', 'Article pages and magazine archives present public titles, authors, dates, and issue context where available.'],
            ].map(([title, description]) => (
              <div key={title} className="border-t border-[var(--border)] pt-4">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-350">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <FaqSection faqs={faqs} loading={faqsLoading} />

      <section className="border-t border-[var(--border)] bg-[var(--background)] py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.7fr_0.3fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Researcher and institution pathway</p>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Clear next steps for research groups and academic teams.
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-650 dark:text-zinc-300">
              Universities, labs, and independent research groups can explore public magazines, review published archives, or contact the editorial team through the public contact route.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-3 sm:flex-row lg:flex-col">
            <Link href="/magazines" className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
              Explore our magazines
            </Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-100 dark:hover:bg-zinc-900">
              Contact the editorial team <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-14 lg:py-16">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Continue reading</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white">
              Explore the public research archive.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/search" className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
              Explore Published Research
            </Link>
            <Link href={submitHref} className="inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-100 dark:hover:bg-zinc-900">
              Submit Your Research
            </Link>
          </div>
        </div>
      </section>
      <AdvertisementSlot placement="content_bottom" context={{ context: 'website', page_key: 'home' }} className="mx-auto max-w-[1440px] px-4 py-8" />
    </div>
  );
}
