'use client';

import React from 'react';
import Link from 'next/link';
import SeoHead from '../components/SeoHead';

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-[var(--background)] px-4 py-20 sm:px-6">
      <SeoHead
        title="Page Not Found"
        ogTitle="Page Not Found - ScholarlyNest"
        description="The requested page could not be located."
        ogUrl="/404"
      />
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Page not found</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-zinc-950 dark:text-white">We could not find that page.</h1>
        <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-350">
          The link may have changed, or the content may no longer be published.
        </p>
        <Link href="/" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
          Return Home
        </Link>
      </div>
    </main>
  );
}
