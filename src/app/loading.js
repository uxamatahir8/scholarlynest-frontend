'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-amber-600 dark:border-zinc-800 dark:border-t-amber-300" />
        <p className="mt-4 text-sm font-semibold text-zinc-600 dark:text-zinc-350">Loading content...</p>
      </div>
    </div>
  );
}
