'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../../utils/api';
import { logError } from '../../../../utils/safeLogger';
import SeoHead from '../../../../components/SeoHead';
import TableOfContents from '../../../../components/magazine/TableOfContents';

const MONTH_ORDER = {
  'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
  'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
};

const normalizeMonth = (monthStr) => {
  if (!monthStr) return 'Unknown';
  const clean = monthStr.trim().toLowerCase();
  if (clean.startsWith('jan')) return 'January';
  if (clean.startsWith('feb')) return 'February';
  if (clean.startsWith('mar')) return 'March';
  if (clean.startsWith('apr')) return 'April';
  if (clean.startsWith('may')) return 'May';
  if (clean.startsWith('jun')) return 'June';
  if (clean.startsWith('jul')) return 'July';
  if (clean.startsWith('aug')) return 'August';
  if (clean.startsWith('sep')) return 'September';
  if (clean.startsWith('oct')) return 'October';
  if (clean.startsWith('nov')) return 'November';
  if (clean.startsWith('dec')) return 'December';
  return monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase();
};

const getArticleYearAndMonth = (article, issueGroup) => {
  if (article.issue?.issue_year && article.issue?.issue_month) {
    return {
      year: String(article.issue.issue_year),
      month: String(article.issue.issue_month)
    };
  }
  const dateStr = article.published_at || issueGroup?.published_at || article.created_at;
  const date = dateStr ? new Date(dateStr) : new Date();
  const year = String(date.getFullYear());
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  return { year, month };
};

const buildArchive = (issues = []) => {
  const archive = {};
  issues.forEach((issueGroup) => {
    (issueGroup.articles || []).forEach((article) => {
      const { year, month } = getArticleYearAndMonth(article, issueGroup);
      const normMonth = normalizeMonth(month);
      if (!archive[year]) {
        archive[year] = {};
      }
      if (!archive[year][normMonth]) {
        archive[year][normMonth] = [];
      }
      if (!archive[year][normMonth].some(a => a.id === article.id)) {
        archive[year][normMonth].push(article);
      }
    });
  });

  // Sort articles inside each month by date descending
  Object.keys(archive).forEach((year) => {
    Object.keys(archive[year]).forEach((month) => {
      archive[year][month].sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at);
        const dateB = new Date(b.published_at || b.created_at);
        return dateB - dateA;
      });
    });
  });

  return archive;
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

  const archive = useMemo(() => buildArchive(data?.issues || []), [data]);

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
      <TableOfContents archive={archive} magazineSlug={slug} onArticleClick={handleTrackClick} />
    </div>
  );
}
