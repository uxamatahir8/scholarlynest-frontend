'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { logError } from '../utils/safeLogger';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    logError('Public page error captured', error?.message);
  }, [error]);

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-[var(--background)] px-4 py-20 sm:px-6">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Something went wrong</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-zinc-950 dark:text-white">This page could not be loaded.</h1>
        <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-350">
          Please try again, or return to the public homepage.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => reset()} className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            Try Again
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-bold text-zinc-850 transition-colors hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-zinc-100 dark:hover:bg-zinc-900">
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
