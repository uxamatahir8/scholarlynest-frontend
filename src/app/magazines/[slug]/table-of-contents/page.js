'use client';

import React, { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import api from '../../../../utils/api';
import { logWarn } from '../../../../utils/safeLogger';
import SeoHead from '../../../../components/SeoHead';
import TableOfContents from '../../../../components/magazine/TableOfContents';
import LoadingState from '../../../../components/ui/LoadingState';
import ErrorState from '../../../../components/ui/ErrorState';

export default function MagazineTableOfContentsPage() {
  const params = useParams();
  const pathname = usePathname();
  const routePrefix = pathname?.startsWith('/journals/') ? 'journals' : 'magazines';
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
        const response = await api.get(`/${routePrefix}/${slug}/table-of-contents`);
        setData(response.data);
      } catch (err) {
        logWarn('Magazine table of contents unavailable', err.message);
        setError('The table of contents could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [routePrefix, slug]);

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
      <SeoHead title={data.seo?.title} description={data.seo?.description} keywords={data.seo?.keywords} ogImage={data.seo?.og_image} ogUrl={`/${routePrefix}/${slug}/table-of-contents`} />
      <TableOfContents archive={data.table_of_contents || {}} magazineSlug={slug} onArticleClick={handleTrackClick} />
    </div>
  );
}
