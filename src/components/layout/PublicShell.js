'use client';

import { Suspense, useEffect, useState } from 'react';
import Header from '../Header';
import Footer from '../global/Footer';
import NewsletterRibbon from '../global/NewsletterRibbon';
import TopAnnounceRibbon from './TopAnnounceRibbon';
import api from '../../utils/api';
import { logWarn } from '../../utils/safeLogger';

export default function PublicShell({ children, pathname }) {
  const isHome = pathname === '/';
  const isUnsubscribeRoute = pathname?.startsWith('/unsubscribe');
  const noHeaderPadding = isHome || (pathname?.startsWith('/magazines/') && pathname !== '/magazines');

  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in sessionStorage
    const isDismissed = sessionStorage.getItem('announcement_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    const fetchAnnouncement = async () => {
      try {
        const cached = sessionStorage.getItem('active_announcement');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            setAnnouncement(parsed);
          }
          return;
        }

        // 1. Fetch latest published article
        const articleRes = await api.get('/articles/latest?limit=1');
        const latestArticle = articleRes.data?.data?.[0];

        if (latestArticle) {
          const payload = {
            type: 'article',
            title: latestArticle.title,
            slug: latestArticle.slug,
            published_at: latestArticle.published_at
          };
          setAnnouncement(payload);
          sessionStorage.setItem('active_announcement', JSON.stringify(payload));
        } else {
          // 2. Fallback to latest magazine
          const magRes = await api.get('/public/magazines?per_page=1');
          const latestMag = magRes.data?.data?.[0];
          if (latestMag) {
            const payload = {
              type: 'magazine',
              title: latestMag.title,
              slug: latestMag.slug,
              published_at: latestMag.published_at || latestMag.created_at
            };
            setAnnouncement(payload);
            sessionStorage.setItem('active_announcement', JSON.stringify(payload));
          } else {
            setAnnouncement(null);
            sessionStorage.setItem('active_announcement', 'null');
          }
        }
      } catch (err) {
        logWarn('Announcement fetch failed in PublicShell', err.message);
        setAnnouncement(null);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('announcement_dismissed', 'true');
  };

  const showRibbon = announcement && !dismissed;

  useEffect(() => {
    if (showRibbon) {
      document.documentElement.classList.add('has-top-ribbon');
    } else {
      document.documentElement.classList.remove('has-top-ribbon');
    }
    return () => document.documentElement.classList.remove('has-top-ribbon');
  }, [showRibbon]);

  const paddingClass = noHeaderPadding
    ? ''
    : (showRibbon ? 'pt-36 md:pt-44' : 'pt-28 md:pt-36');

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50 flex flex-col">
        {showRibbon && (
          <TopAnnounceRibbon
            announcement={announcement}
            onDismiss={handleDismiss}
          />
        )}
        <Suspense fallback={<div className="h-20 border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950" />}>
          <Header />
        </Suspense>
      </div>
      <main className={`flex-grow w-full flex flex-col ${paddingClass}`}>
        {children}
      </main>
      {!isUnsubscribeRoute && <NewsletterRibbon />}
      <Footer />
    </>
  );
}
