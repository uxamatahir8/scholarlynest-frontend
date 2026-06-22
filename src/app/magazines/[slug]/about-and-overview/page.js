'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { ArrowRight } from 'lucide-react';
import api from '../../../../utils/api';
import { logWarn } from '../../../../utils/safeLogger';
import { useAuth } from '../../../../context/AuthContext';
import SeoHead from '../../../../components/SeoHead';
import LoadingState from '../../../../components/ui/LoadingState';
import ErrorState from '../../../../components/ui/ErrorState';

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const cleanHtml = (html = '') => {
  if (!html) return '';
  if (typeof window !== 'undefined') return DOMPurify.sanitize(html);
  return html;
};

const issueLabel = (issue) => {
  if (!issue) return '';
  const parts = [];
  if (issue.volume_number) parts.push(`Volume ${issue.volume_number}`);
  if (issue.issue_number) parts.push(`Issue ${issue.issue_number}`);
  if (issue.issue_month || issue.issue_year) parts.push([issue.issue_month, issue.issue_year].filter(Boolean).join(' '));
  return parts.join(' - ');
};

export default function MagazineAboutPage() {
  const params = useParams();
  const slug = params?.slug;
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        const [aboutRes, articlesRes] = await Promise.all([
          api.get(`/magazines/${slug}/about-and-overview`),
          api.get(`/magazines/${slug}/latest-published-articles`, { params: { limit: 10 } }),
        ]);
        if (!active) return;
        setData(aboutRes.data);
        setArticles(articlesRes.data?.data || []);
      } catch (err) {
        logWarn('Magazine overview unavailable', err.message);
        if (active) setError('The requested magazine overview could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPage();
    return () => {
      active = false;
    };
  }, [slug]);

  const magazine = data?.magazine;
  const summaryText = useMemo(() => stripHtml(magazine?.about_text || magazine?.description || ''), [magazine]);
  const cleanAboutHtml = useMemo(() => cleanHtml(magazine?.about_text || ''), [magazine]);
  const latestIssueArticle = useMemo(() => articles.find((article) => article.issue), [articles]);
  const submitHref = user ? '/admin/articles/new' : '/login';

  if (loading) return <LoadingState label="Loading overview..." className="min-h-[320px]" />;

  if (error || !magazine) {
    return <ErrorState title="Overview could not be loaded">{error || 'Overview could not be resolved.'}</ErrorState>;
  }

  return (
    <div className="space-y-14">
      <SeoHead title={data.seo?.title} description={data.seo?.description} keywords={data.seo?.keywords} ogImage={data.seo?.og_image} ogUrl={`/magazines/${slug}/about-and-overview`} />

      <section className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr]" aria-labelledby="about-magazine-heading">
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">About this journal</p>
          <h2 id="about-magazine-heading" className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white sm:text-4xl">{magazine.title}</h2>
        </div>
        <div className="max-w-3xl">
          {magazine.description && <p className="text-lg leading-8 text-zinc-650 dark:text-zinc-300">{magazine.description}</p>}
          {cleanAboutHtml ? (
            <div className="cms-content-prose mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: cleanAboutHtml }} />
          ) : (
            <p className="mt-6 text-base leading-8 text-zinc-650 dark:text-zinc-300">No comprehensive overview has been drafted for this magazine yet.</p>
          )}
        </div>
      </section>

      <section className="grid gap-8 border-t border-[var(--border)] pt-10 lg:grid-cols-[0.36fr_0.64fr]" aria-labelledby="scope-heading">
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Scope and focus</p>
          <h2 id="scope-heading" className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white">What readers can expect</h2>
        </div>
        <p className="max-w-3xl text-base leading-8 text-zinc-650 dark:text-zinc-300">
          {summaryText || 'This publication currently provides public discovery through its overview, article pages, and table of contents archive.'}
        </p>
      </section>

      <section className="grid gap-8 border-t border-[var(--border)] pt-10 lg:grid-cols-[0.36fr_0.64fr]" aria-labelledby="publishing-info-heading">
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Publishing information</p>
          <h2 id="publishing-info-heading" className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white">Public archive details</h2>
        </div>
        <div className="max-w-3xl">
          <p className="text-base leading-8 text-zinc-650 dark:text-zinc-300">
            Published articles for this journal are available through its public table of contents. Editorial review and contributor tools remain inside the secure console.
          </p>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{articles.length} latest published {articles.length === 1 ? 'article is' : 'articles are'} available in this public view.</p>
        </div>
      </section>

      <section className="grid gap-8 border-t border-[var(--border)] pt-10 lg:grid-cols-[0.36fr_0.64fr]" aria-labelledby="latest-issue-heading">
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Latest available issue</p>
          <h2 id="latest-issue-heading" className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white">Recent publication context</h2>
        </div>
        {latestIssueArticle ? (
          <article className="max-w-3xl border-y border-[var(--border)] py-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{issueLabel(latestIssueArticle.issue) || 'Published issue'}</p>
            <h3 className="mt-2 font-serif text-2xl font-bold text-zinc-950 dark:text-white">{latestIssueArticle.issue?.special_title || latestIssueArticle.title}</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-350">Latest article in this issue: {latestIssueArticle.title}</p>
            <Link href={`/magazines/${slug}/table-of-contents`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-300">
              Browse this issue <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        ) : (
          <div className="max-w-3xl border-y border-[var(--border)] py-6">
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-350">No public issue assignment is available from the latest published articles yet.</p>
            <Link href={`/magazines/${slug}/table-of-contents`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-300">
              Open publication archive <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section className="grid gap-8 border-t border-[var(--border)] pt-10 lg:grid-cols-[0.36fr_0.64fr]" aria-labelledby="explore-heading">
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Explore published content</p>
          <h2 id="explore-heading" className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white">Continue into the archive</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={`/magazines/${slug}/table-of-contents`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            View Table of Contents
          </Link>
          <Link href={submitHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-100 dark:hover:bg-zinc-900">
            Submit Article <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
