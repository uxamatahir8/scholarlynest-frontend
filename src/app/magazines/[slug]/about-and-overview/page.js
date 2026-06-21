'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpenText, FileText, Info } from 'lucide-react';
import api from '../../../../utils/api';
import { logWarn } from '../../../../utils/safeLogger';
import SeoHead from '../../../../components/SeoHead';
import MagazineArticleCarousel from '../../../../components/magazine/MagazineArticleCarousel';
import LoadingState from '../../../../components/ui/LoadingState';
import ErrorState from '../../../../components/ui/ErrorState';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  if (path.startsWith('/images/') || path.startsWith('images/')) return path.startsWith('/') ? path : `/${path}`;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}${cleanPath}`;
};

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function MagazineAboutPage() {
  const params = useParams();
  const slug = params?.slug;
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

  const handleTrackClick = async (articleId) => {
    try {
      await api.post(`/articles/${articleId}/click`);
    } catch (err) {
      logWarn('Article click tracking unavailable', err.message);
    }
  };

  const magazine = data?.magazine;
  const summaryText = useMemo(() => stripHtml(magazine?.about_text || magazine?.description || ''), [magazine]);

  if (loading) return <LoadingState label="Loading overview..." className="min-h-[320px]" />;

  if (error || !magazine) {
    return <ErrorState title="Overview could not be loaded">{error || 'Overview could not be resolved.'}</ErrorState>;
  }

  return (
    <div className="space-y-12">
      <SeoHead title={data.seo?.title} description={data.seo?.description} keywords={data.seo?.keywords} ogImage={data.seo?.og_image} ogUrl={`/magazines/${slug}/about-and-overview`} />

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-6 sm:p-8" aria-labelledby="about-magazine-heading">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <Info className="h-4 w-4" aria-hidden="true" />
            About this magazine
          </p>
          <h2 id="about-magazine-heading" className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">{magazine.title}</h2>
          {magazine.description && <p className="mt-4 text-base leading-8 text-zinc-650 dark:text-zinc-300">{magazine.description}</p>}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_260px]">
          <div className="prose prose-zinc max-w-none text-zinc-650 dark:prose-invert dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: magazine.about_text || '<p>No comprehensive overview has been drafted for this magazine yet.</p>' }} />
          <aside className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Key details</h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-zinc-500 dark:text-zinc-450">Public summary</dt>
                <dd className="mt-1 line-clamp-4 text-zinc-700 dark:text-zinc-250">{summaryText || 'Overview pending.'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-500 dark:text-zinc-450">Latest articles</dt>
                <dd className="mt-1 text-zinc-700 dark:text-zinc-250">{articles.length} available in this view</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2" aria-label="Magazine actions">
        <Link href={`/magazines/${slug}/table-of-contents`} className="group rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-6 transition-colors hover:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500">
          <FileText className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">View Table of Contents</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-350">Browse published articles by issue, month, and year.</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-300">Open archive <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
        </Link>
        <Link href="/admin/articles/new" className="group rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-6 transition-colors hover:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500">
          <BookOpenText className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">Submit Article</h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-350">Use the contributor console to begin a supported manuscript workflow.</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-300">Start submission <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
        </Link>
      </section>

      <section className="space-y-5" aria-labelledby="magazine-latest-articles-heading">
        <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-5">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Latest Published Articles</p>
          <h2 id="magazine-latest-articles-heading" className="font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">Recent work in {magazine.title}</h2>
        </div>
        <MagazineArticleCarousel articles={articles} coverImage={magazine.cover_image} getImageUrl={getFullImageUrl} onArticleClick={handleTrackClick} />
      </section>
    </div>
  );
}
