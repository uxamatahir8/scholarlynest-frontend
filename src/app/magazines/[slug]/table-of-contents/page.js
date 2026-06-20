'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../../utils/api';
import { logError } from '../../../../utils/safeLogger';
import SeoHead from '../../../../components/SeoHead';
import TableOfContents from '../../../../components/magazine/TableOfContents';

const monthKey = (dateString) => {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const groupArticlesByMonth = (issues = []) => {
  return issues.reduce((groups, issueGroup) => {
    (issueGroup.articles || []).forEach((article) => {
      const key = monthKey(article.published_at || issueGroup.published_at || article.created_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(article);
    });
    return groups;
  }, {});
};

export default function MagazineTableOfContentsPage() {
  const params = useParams();
  const slug = params?.slug;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/magazines/${slug}/table-of-contents`);
        setData(response.data);
      } catch (err) {
        logError('Failed to load table of contents', err);
        setError('The table of contents could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  const groupedArticles = useMemo(() => groupArticlesByMonth(data?.issues || []), [data]);

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
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Loading table of contents...</span>
      </div>
    );
  }

  if (error || !data?.magazine) {
    return (
      <div className="max-w-md mx-auto flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-red-700 dark:text-red-400 text-xs">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="font-semibold">{error || 'Table of contents could not be resolved.'}</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <SeoHead title={data.seo?.title} description={data.seo?.description} keywords={data.seo?.keywords} ogImage={data.seo?.og_image} ogUrl={`/magazines/${slug}/table-of-contents`} />
      <TableOfContents groupedArticles={groupedArticles} magazineSlug={slug} onArticleClick={handleTrackClick} />
    </div>
  );
}
