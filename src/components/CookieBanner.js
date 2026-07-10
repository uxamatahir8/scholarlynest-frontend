'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'scholarlynest-cookie-notice-accepted';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== 'true');
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl sm:flex sm:items-center sm:gap-5" role="dialog" aria-label="Cookie notice">
      <p className="flex-1 text-sm leading-relaxed text-[var(--muted)]">We use cookies to improve your experience, analyze site usage, and support essential platform functionality. By continuing, you agree to our cookie policy. <Link href="/privacy" className="font-bold text-amber-700 underline dark:text-amber-300">Privacy policy</Link></p>
      <button type="button" onClick={accept} className="mt-3 min-h-10 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 sm:mt-0">Accept</button>
    </aside>
  );
}
