'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import NewsletterRibbon from './global/NewsletterRibbon';
import { Suspense } from 'react';

export default function MainLayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isUnsubscribeRoute = pathname?.startsWith('/unsubscribe');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-zinc-200/80 bg-[#fdfdfc] dark:bg-[#121211]" />}>
        <Header />
      </Suspense>
      <main className={`flex-grow w-full flex flex-col ${pathname === '/' ? '' : 'pt-28 md:pt-36'}`}>
        {children}
      </main>
      {!isUnsubscribeRoute && <NewsletterRibbon />}
      <Footer />
    </>
  );
}
