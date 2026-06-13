'use client';

import { Suspense } from 'react';
import Header from '../Header';
import Footer from '../global/Footer';
import NewsletterRibbon from '../global/NewsletterRibbon';

export default function PublicShell({ children, pathname }) {
  const isHome = pathname === '/';
  const isUnsubscribeRoute = pathname?.startsWith('/unsubscribe');
  const noHeaderPadding = isHome || (pathname?.startsWith('/magazines/') && pathname !== '/magazines');

  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950" />}>
        <Header />
      </Suspense>
      <main className={`flex-grow w-full flex flex-col ${noHeaderPadding ? '' : 'pt-28 md:pt-36'}`}>
        {children}
      </main>
      {!isUnsubscribeRoute && <NewsletterRibbon />}
      <Footer />
    </>
  );
}
