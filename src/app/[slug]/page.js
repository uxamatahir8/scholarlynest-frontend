'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../utils/api';
import DOMPurify from 'dompurify';
import PageBanner from '../../components/PageBanner';
import SeoHead from '../../components/SeoHead';

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
        console.error('Failed to load page data:', err);
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
      <div className="bg-[var(--background)] min-h-screen text-left">
        <PageBanner title="Loading..." description="Please wait while we retrieve the content." />
        <div className="w-full py-12 px-6">
          {/* Shimmer skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-zinc-150 dark:bg-zinc-850 rounded-xl"></div>
              <div className="h-4 bg-zinc-150 dark:bg-zinc-850 rounded-xl w-5/6"></div>
              <div className="h-4 bg-zinc-150 dark:bg-zinc-850 rounded-xl w-4/6"></div>
            </div>
            <div className="h-36 bg-zinc-150 dark:bg-zinc-850 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="bg-[var(--background)] min-h-screen text-left flex flex-col justify-between">
        <div>
          <PageBanner title="Page Not Found" description="The requested custom page could not be located." />
          <div className="w-full py-20 px-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-zinc-855 dark:text-zinc-200">Content Unavailable</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The link you followed may be broken, or the administrator may have marked this page as hidden.
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer hover:opacity-90"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)] min-h-screen text-left transition-premium">
      <SeoHead
        title={`${pageData.title} | ScholarlyNest`}
        description={`Read the ${pageData.title} on ScholarlyNest.`}
        keywords={`scholarlynest, ${pageData.title.toLowerCase()}`}
        ogUrl={`/${pageData.slug}`}
      />
      
      <PageBanner 
        title={pageData.title} 
        description={`ScholarlyNest platform publication dynamic resource page.`}
        customLabels={{ [pageData.slug]: pageData.title }}
      />

      <div className="flex-grow flex flex-col space-y-12 w-full pb-16 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-10">
        <article className="bg-white dark:bg-[#121211] border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 sm:p-10 shadow-sm">
          <h1 className="text-3xl font-serif font-bold mb-6 text-zinc-900 dark:text-white">{pageData.title}</h1>
          <div 
            className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
          />
        </article>
      </div>
    </div>
  );
}
