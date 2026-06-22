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
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchAnnouncement = async () => {
      try {
        const articleRes = await api.get('/articles/latest', { params: { limit: 1 } });
        const latestArticle = articleRes.data?.data?.[0];

        if (latestArticle) {
          if (active) {
            setAnnouncement({
              type: 'article',
              title: latestArticle.title,
              slug: latestArticle.slug,
            });
          }
          return;
        }

        const magazineRes = await api.get('/public/magazines', { params: { per_page: 1 } });
        const latestMagazine = magazineRes.data?.data?.[0];

        if (active) {
          setAnnouncement(latestMagazine ? {
            type: 'magazine',
            title: latestMagazine.title,
            slug: latestMagazine.slug,
          } : null);
        }
      } catch (err) {
        logWarn('Public announcement unavailable', err.message);
        if (active) setAnnouncement(null);
      }
    };

    fetchAnnouncement();

    return () => {
      active = false;
    };
  }, []);

  const showRibbon = announcement && !dismissed;

  return (
    <>
      <div className="sticky top-0 z-50 w-full">
        {showRibbon && <TopAnnounceRibbon announcement={announcement} onDismiss={() => setDismissed(true)} />}
        <Suspense fallback={<div className="h-16 border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950" />}>
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
