'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../../utils/api';
import { logWarn } from '../../../../utils/safeLogger';
import SeoHead from '../../../../components/SeoHead';
import TableOfContents from '../../../../components/magazine/TableOfContents';
import LoadingState from '../../../../components/ui/LoadingState';
import ErrorState from '../../../../components/ui/ErrorState';

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
        logWarn('Magazine table of contents unavailable', err.message);
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
      logWarn('Article click tracking unavailable', err.message);
    }
  };

  if (loading) {
    return <LoadingState label="Loading table of contents..." className="min-h-[320px]" />;
  }

  if (error || !data?.magazine) {
    return <ErrorState title="Archive could not be loaded">{error || 'Table of contents could not be resolved.'}</ErrorState>;
  }

  return (
    <div>
      <SeoHead title={data.seo?.title} description={data.seo?.description} keywords={data.seo?.keywords} ogImage={data.seo?.og_image} ogUrl={`/magazines/${slug}/table-of-contents`} />
      <TableOfContents archive={archive} magazineSlug={slug} onArticleClick={handleTrackClick} />
    </div>
  );
}
