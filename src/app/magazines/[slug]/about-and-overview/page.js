'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import api from '../../../../utils/api';
import { logError } from '../../../../utils/safeLogger';
import SeoHead from '../../../../components/SeoHead';
import MagazineArticleCarousel from '../../../../components/magazine/MagazineArticleCarousel';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  if (path.startsWith('/images/') || path.startsWith('images/')) return path.startsWith('/') ? path : '/' + path;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${domain}${cleanPath}`;
};

export default function MagazineAboutPage() {
  const params = useParams();
  const slug = params?.slug;
  const [data, setData] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        const [aboutRes, articlesRes] = await Promise.all([
          api.get(`/magazines/${slug}/about-and-overview`),
          api.get(`/magazines/${slug}/latest-published-articles`, { params: { limit: 10 } }),
        ]);
        setData(aboutRes.data);
        setArticles(articlesRes.data?.data || []);
      } catch (err) {
        logError('Failed to load magazine about page', err);
        setError('The requested magazine overview could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  const handleTrackClick = async (articleId) => {
    try {
      await api.post(`/articles/${articleId}/click`);
    } catch (err) {
      logError('Failed to track click', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Loading overview...</span>
      </div>
    );
  }

  if (error || !data?.magazine) {
    return (
      <div className="max-w-md mx-auto flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-red-700 dark:text-red-400 text-xs">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="font-semibold">{error || 'Overview could not be resolved.'}</span>
      </div>
    );
  }

  const magazine = data.magazine;

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <SeoHead title={data.seo?.title} description={data.seo?.description} keywords={data.seo?.keywords} ogImage={data.seo?.og_image} ogUrl={`/magazines/${slug}/about-and-overview`} />

      <section className="space-y-6">
        <div className="border-b border-zinc-100 dark:border-zinc-900/80 pb-4">
          <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">About the Magazine</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_160px] gap-6 items-start">
          <div className="space-y-5">
            <p className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed font-medium">{magazine.description}</p>
            <div className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed prose dark:prose-invert max-w-none font-serif tracking-normal" dangerouslySetInnerHTML={{ __html: magazine.about_text || 'No comprehensive overview description has been drafted for this publication.' }} />
          </div>
          {magazine.cover_image && (
            <div className="hidden md:block rounded-xl overflow-hidden border border-zinc-200/70 dark:border-zinc-850 bg-white/80 dark:bg-zinc-900/30 shadow-sm">
              <img src={getFullImageUrl(magazine.cover_image)} alt={magazine.title} className="w-full aspect-[3/4] object-cover" />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="magazine-latest-articles-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-zinc-100 dark:border-zinc-900/80 pt-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/10 text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3 h-3" />
              Latest Published Articles
            </div>
            <h3 id="magazine-latest-articles-heading" className="font-serif text-xl font-bold text-zinc-900 dark:text-white">Published in {magazine.title}</h3>
          </div>
        </div>
        <MagazineArticleCarousel articles={articles} coverImage={magazine.cover_image} getImageUrl={getFullImageUrl} onArticleClick={handleTrackClick} />
      </section>
    </div>
  );
}
