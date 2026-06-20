'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../../../utils/api';
import { logError } from '../../../../utils/safeLogger';
import SeoHead from '../../../../components/SeoHead';

export default function MagazineCustomPage() {
  const params = useParams();
  const slug = params?.slug;
  const pageSlug = params?.pageSlug;
  const [data, setData] = useState(null);
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
      } catch (err) {
        logError('Failed to load custom magazine page', err);
        setError('The requested custom editorial page could not be found.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, pageSlug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Loading page...</span>
      </div>
    );
  }

  if (error || !data?.page) {
    return (
      <div className="max-w-md mx-auto space-y-6 text-center py-10">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">Page Retrieval Error</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{error || 'Page could not be resolved.'}</p>
        </div>
        <Link href={`/magazines/${slug}/about-and-overview`} className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-450 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Magazine Overview</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SeoHead title={data.seo?.title} description={data.seo?.description} keywords={data.seo?.keywords} ogImage={data.seo?.og_image} ogUrl={`/magazines/${slug}/${pageSlug}`} />
      <div className="border-b border-zinc-100 dark:border-zinc-900/80 pb-4">
        <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">{data.page.title}</h2>
      </div>
      <div className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed prose dark:prose-invert max-w-none font-serif tracking-normal" dangerouslySetInnerHTML={{ __html: data.page.content }} />
    </div>
  );
}
