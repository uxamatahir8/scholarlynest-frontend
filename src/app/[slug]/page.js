'use client';

import { logError } from '../../utils/safeLogger';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Globe, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import DOMPurify from 'dompurify';
import SeoHead from '../../components/SeoHead';
import PageTitle from '../../components/PageTitle';
import { humanizeRouteSegment } from '../../utils/pageTitle';

export default function CustomFooterPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    if (!slug) return;
    let active = true;

    api.get(`/public/footer/pages/${slug}`)
      .then((res) => {
        if (active && res.data) {
          setPageData(res.data);

          // Sanitize content_html using DOMPurify (client-side only to prevent SSR issues)
          if (res.data.content) {
            setSanitizedHtml(DOMPurify.sanitize(res.data.content));
          }
        }
      })
      .catch((err) => {
        logError('Failed to load page data:', err);
        if (active) {
          setPageData(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-zinc-50/20 dark:bg-zinc-950/10 min-h-screen pt-32 pb-24 font-sans text-left">
        <PageTitle title={humanizeRouteSegment(slug)} />
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Breadcrumb shimmer */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 animate-pulse" />

          {/* Page Card shimmer */}
          <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-100 dark:border-zinc-900/60 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="h-8 bg-zinc-305 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
            <div className="space-y-3 pt-4">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6 animate-pulse" />
            </div>
            <div className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="bg-zinc-50/20 dark:bg-zinc-950/10 min-h-screen pt-32 pb-24 font-sans text-left flex flex-col justify-center">
        <PageTitle title="Content Unavailable" />
        <div className="max-w-md w-full mx-auto px-6 text-center space-y-6">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-600" />
          <div className="space-y-2">
            <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">Content Unavailable</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              The dynamic policy or guideline page you requested could not be found, or has been temporarily unpublished by the administrator.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer hover:opacity-90"
          >
            <span>Return to Homepage</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50/20 dark:bg-zinc-950/10 min-h-screen pt-32 pb-24 font-sans text-left transition-premium">
      <SeoHead
        title={pageData.title}
        ogTitle={`${pageData.title} | ScholarlyNest`}
        description={`Read the ${pageData.title} guidelines and policies on ScholarlyNest.`}
        keywords={`scholarlynest, ${pageData.title.toLowerCase()}, guidelines, policies`}
        ogUrl={`/${pageData.slug}`}
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-400">
          <Link href="/" className="hover:text-amber-605 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-zinc-300" />
          <span className="text-zinc-500 dark:text-zinc-400 truncate">{pageData.title}</span>
        </div>

        {/* Readable Content Article Card */}
        <article className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-100 dark:border-zinc-900/60 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">

          {/* Header */}
          <div className="space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800/80">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-white leading-tight">
              {pageData.title}
            </h1>
          </div>

          {/* Render Rich Text Content with Custom Prose Rules */}
          <div
            className="cms-content-prose"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />

        </article>

        {/* Bottom Back Button */}
        <div className="flex justify-center pt-4">
          <Link
            href="/"
            className="group inline-flex items-center space-x-2 text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-405 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1 text-amber-500" />
            <span>Return to Homepage</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
