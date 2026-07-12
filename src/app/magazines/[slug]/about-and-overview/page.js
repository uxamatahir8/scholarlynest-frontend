'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { ArrowRight } from 'lucide-react';
import api from '../../../../utils/api';
import { logWarn } from '../../../../utils/safeLogger';
import { useAuth } from '../../../../context/AuthContext';
import SeoHead from '../../../../components/SeoHead';
import LoadingState from '../../../../components/ui/LoadingState';
import ErrorState from '../../../../components/ui/ErrorState';

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
  const pathname = usePathname();
  const routePrefix = pathname?.startsWith('/journals/') ? 'journals' : 'magazines';
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
          api.get(`/${routePrefix}/${slug}/about-and-overview`),
          api.get(`/${routePrefix}/${slug}/latest-published-articles`, { params: { limit: 10 } }),
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
  }, [routePrefix, slug]);

  const magazine = data?.magazine;
  const cleanAboutHtml = useMemo(() => cleanHtml(magazine?.about_text || ''), [magazine]);
  const latestIssueArticle = useMemo(() => articles.find((article) => article.issue), [articles]);
  const latestArticles = useMemo(() => articles.slice(0, 3), [articles]);
  const submitHref = user ? '/admin/articles/new' : '/login';

  if (loading) return <LoadingState label="Loading overview..." className="min-h-[320px]" />;

  if (error || !magazine) {
    return <ErrorState title="Overview could not be loaded">{error || 'Overview could not be resolved.'}</ErrorState>;
  }

  return (
    <div className="space-y-12">
      <SeoHead title={data.seo?.title} description={data.seo?.description} keywords={data.seo?.keywords} ogImage={data.seo?.og_image} ogUrl={`/${routePrefix}/${slug}/about-and-overview`} />

      {(magazine.description || cleanAboutHtml) && (
        <section aria-labelledby="about-magazine-heading">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Overview</p>
          <h2 id="about-magazine-heading" className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white sm:text-4xl">{magazine.title}</h2>
          {magazine.description && <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-650 dark:text-zinc-300">{magazine.description}</p>}
          {cleanAboutHtml && (
            <div className="cms-content-prose mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: cleanAboutHtml }} />
          )}
        </section>
      )}

      {latestIssueArticle && (
        <section className="grid gap-8 border-t border-[var(--border)] pt-10 lg:grid-cols-[0.36fr_0.64fr]" aria-labelledby="latest-issue-heading">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Latest available issue</p>
            <h2 id="latest-issue-heading" className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white">Issue context</h2>
          </div>
          <article className="max-w-3xl border-y border-[var(--border)] py-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{issueLabel(latestIssueArticle.issue) || 'Published issue'}</p>
            <h3 className="mt-2 font-serif text-2xl font-bold text-zinc-950 dark:text-white">{latestIssueArticle.issue?.special_title || latestIssueArticle.title}</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-350">Latest article in this issue: {latestIssueArticle.title}</p>
            <Link href={`/${routePrefix}/${slug}/table-of-contents`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-300">
              Browse this issue <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        </section>
      )}

      {latestArticles.length > 0 && (
        <section className="border-t border-[var(--border)] pt-10" aria-labelledby="latest-articles-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Latest published articles</p>
            <h2 id="latest-articles-heading" className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white">Recent research</h2>
          </div>
          <div className="mt-6 divide-y divide-[var(--border)]">
            {latestArticles.map((article) => (
              <article key={article.id} className="py-5">
                <h3 className="font-serif text-xl font-bold leading-snug text-zinc-950 dark:text-white">
                  <Link href={`/${routePrefix}/${slug}/articles/${article.slug}`} className="underline-offset-4 hover:text-amber-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-amber-300">
                    {article.title}
                  </Link>
                </h3>
                {article.issue && <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{issueLabel(article.issue)}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-10 sm:flex-row">
        <Link href={`/${routePrefix}/${slug}/table-of-contents`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
          View Table of Contents
        </Link>
        <Link href={submitHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-zinc-100 dark:hover:bg-zinc-900">
          Submit Article <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
