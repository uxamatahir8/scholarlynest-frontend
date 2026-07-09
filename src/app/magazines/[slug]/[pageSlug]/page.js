'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DOMPurify from 'dompurify';
import { ArrowLeft } from 'lucide-react';
import api from '../../../../utils/api';
import { logWarn } from '../../../../utils/safeLogger';
import SeoHead from '../../../../components/SeoHead';
import LoadingState from '../../../../components/ui/LoadingState';
import ErrorState from '../../../../components/ui/ErrorState';

export default function MagazineCustomPage() {
  const params = useParams();
  const slug = params?.slug;
  const pageSlug = params?.pageSlug;
  const [data, setData] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug || !pageSlug) return;

    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/magazines/${slug}/pages/${pageSlug}`);
        setData(response.data);
        setContent(DOMPurify.sanitize(response.data?.page?.content || ''));
      } catch (err) {
        logWarn('Custom magazine page unavailable', err.message);
        setError('The requested custom editorial page could not be found.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, pageSlug]);

  if (loading) {
    return <LoadingState label="Loading page..." className="min-h-[320px]" />;
  }

  if (error || !data?.page) {
    return (
      <div className="space-y-6">
        <ErrorState title="Page could not be loaded">{error || 'Page could not be resolved.'}</ErrorState>
        <Link href={`/magazines/${slug}/about-and-overview`} className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-300">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to magazine overview</span>
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-8">
      <SeoHead title={data.seo?.title} description={data.seo?.description} keywords={data.seo?.keywords} ogImage={data.seo?.og_image} ogUrl={`/magazines/${slug}/${pageSlug}`} />
      <div className="border-b border-[var(--border)] pb-6">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Magazine page</p>
        <h2 className="mt-2 font-serif text-4xl font-bold leading-tight text-zinc-950 dark:text-white">{data.page.title}</h2>
      </div>
      <div className="cms-content-prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
