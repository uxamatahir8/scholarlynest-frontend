'use client';

import { Suspense, useEffect, useState } from 'react';
import Header from '../Header';
import Footer from '../global/Footer';
import NewsletterRibbon from '../global/NewsletterRibbon';
import TopAnnounceRibbon from './TopAnnounceRibbon';
import api from '../../utils/api';
import { logWarn } from '../../utils/safeLogger';

export default function PublicShell({ children, pathname }) {
  const isUnsubscribeRoute = pathname?.startsWith('/unsubscribe');
  const [announcementItems, setAnnouncementItems] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchAnnouncements = async () => {
      const [articleResult, magazineResult] = await Promise.allSettled([
        api.get('/articles/latest', { params: { limit: 10 } }),
        api.get('/public/magazines', { params: { per_page: 5 } }),
      ]);

      if (articleResult.status === 'rejected') logWarn('Public article headlines unavailable', articleResult.reason?.message);
      if (magazineResult.status === 'rejected') logWarn('Public magazine headlines unavailable', magazineResult.reason?.message);

      const articleData = articleResult.status === 'fulfilled' ? articleResult.value.data : null;
      const magazineData = magazineResult.status === 'fulfilled' ? magazineResult.value.data : null;
      const articles = (articleData?.status === 'success' ? articleData.data : articleData?.data) || [];
      const magazines = magazineData?.data || [];

      const nextItems = [
        ...articles.map((article) => ({
          type: 'article',
          title: article.title,
          slug: article.slug,
        })),
        ...magazines.map((magazine) => ({
          type: 'magazine',
          title: magazine.title,
          slug: magazine.slug,
        })),
      ].filter((item) => item.title && item.slug);

      if (active) setAnnouncementItems(nextItems);
    };

    fetchAnnouncements();

    return () => {
      active = false;
    };
  }, []);

  const showRibbon = announcementItems.length > 0 && !dismissed;

  return (
    <>
      <div className="sticky top-0 z-50 w-full">
        {showRibbon && <TopAnnounceRibbon items={announcementItems} onDismiss={() => setDismissed(true)} />}
        <Suspense fallback={<div className="h-16 bg-white dark:bg-zinc-950" />}>
          <Header />
        </Suspense>
      </div>

      <main className="flex w-full flex-grow flex-col">
        {children}
      </main>

      {!isUnsubscribeRoute && <NewsletterRibbon />}
      <Footer />
    </>
  );
}
