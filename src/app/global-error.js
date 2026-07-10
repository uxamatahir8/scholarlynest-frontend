'use client';

import React, { useEffect } from 'react';
import { logError } from '../utils/safeLogger';
import './globals.css';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    logError('Global page error captured', error?.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <main className="flex min-h-screen items-center justify-center px-4 py-20 sm:px-6">
          <div className="max-w-xl text-center">
            <p className="text-sm font-semibold text-amber-700">ScholarlyNest</p>
            <h1 className="mt-3 font-serif text-4xl font-bold">The site could not finish loading.</h1>
            <p className="mt-4 text-base leading-8 text-zinc-600">
              Please retry the page. Technical details have been kept out of the public view.
            </p>
            <button type="button" onClick={() => reset()} className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
              Try Again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
