'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Check, Mail, Send } from 'lucide-react';
import api from '../../utils/api';
import { logWarn } from '../../utils/safeLogger';

const EXPLORE_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Magazines', href: '/magazines' },
  { label: 'Search', href: '/search' },
  { label: 'Contact', href: '/contact' },
];

const CONTRIBUTOR_LINKS = [
  { label: 'Submit an Article', href: '/admin/articles/new' },
  { label: 'Author Login', href: '/login' },
  { label: 'Reviewer Login', href: '/login' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;
    api.get('/public/footer')
      .then((res) => {
        if (active && Array.isArray(res.data)) setCategories(res.data);
      })
      .catch((err) => {
        logWarn('Dynamic footer fetch failed', err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const cmsCategories = useMemo(() => (
    categories
      .map((category) => ({
        ...category,
        pages: Array.isArray(category.pages) ? category.pages.filter((page) => page?.slug && page?.title) : [],
      }))
      .filter((category) => category.pages.length > 0)
  ), [categories]);

  const legalPages = useMemo(() => (
    cmsCategories
      .flatMap((category) => category.pages)
      .filter((page) => /privacy|terms|policy|legal/i.test(`${page.title} ${page.slug}`))
      .slice(0, 4)
  ), [cmsCategories]);

  const handleSubscribeSubmit = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    setError('');
    setMessage('');

    if (!trimmedEmail) {
      setError('Enter an email address to subscribe.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/newsletter/subscribe', { email: trimmedEmail });
      setSubscribed(true);
      setMessage('Subscription confirmed. Please check your inbox for future updates.');
      setEmail('');
    } catch (err) {
      setError('Subscription could not be completed right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto w-full border-t border-zinc-200 bg-zinc-50 text-left dark:border-zinc-850 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1.4fr_1fr] lg:gap-14">
          <section className="space-y-5" aria-labelledby="footer-brand-heading">
            <Image src="/logo.png" alt="Scholarly Nest" width={690} height={362} className="h-10 w-auto object-contain" />
            <h2 id="footer-brand-heading" className="font-serif text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">Scholarly Nest</h2>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-350">
              Scholarly Nest helps researchers, editors, and institutions publish and discover trusted academic work through clear public archives and structured editorial workflows.
            </p>
            <p className="max-w-sm text-sm font-semibold leading-relaxed text-zinc-800 dark:text-zinc-200">
              Open discovery, careful review, and durable scholarly records.
            </p>
          </section>

          <nav className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" aria-label="Footer navigation">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Explore</h3>
              <ul className="mt-4 space-y-3">
                {EXPLORE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-zinc-350 dark:hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">For Contributors</h3>
              <ul className="mt-4 space-y-3">
                {CONTRIBUTOR_LINKS.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-zinc-350 dark:hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {cmsCategories.slice(0, 2).map((category) => (
              <div key={category.id || category.name}>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{category.name}</h3>
                <ul className="mt-4 space-y-3">
                  {category.pages.slice(0, 5).map((page) => (
                    <li key={page.id || page.slug}>
                      <Link href={`/${page.slug}`} className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-zinc-350 dark:hover:text-white">
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <section className="bg-transparent lg:border-l lg:border-zinc-200 lg:pl-8 dark:lg:border-zinc-850" aria-labelledby="newsletter-heading">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Mail className="h-4 w-4" aria-hidden="true" />
              <h3 id="newsletter-heading" className="text-sm font-bold text-zinc-950 dark:text-white">Newsletter</h3>
            </div>
            <p id="newsletter-help" className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-350">
              Receive occasional platform updates and newly published research highlights. You can unsubscribe from newsletter preferences at any time.
            </p>

            <form onSubmit={handleSubscribeSubmit} className="mt-5 space-y-3" noValidate>
              <label htmlFor="footer-newsletter-email" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">Email address</label>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                    setMessage('');
                    setSubscribed(false);
                  }}
                  aria-describedby="newsletter-help newsletter-status"
                  aria-invalid={Boolean(error)}
                  placeholder="name@university.edu"
                  className="min-h-11 w-full rounded-md border border-zinc-250 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20 dark:border-zinc-750 dark:bg-zinc-950 dark:text-white"
                />
                <button type="submit" disabled={submitting} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900">
                  {subscribed ? <Check className="h-4 w-4" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  {submitting ? 'Sending' : 'Subscribe'}
                </button>
              </div>
              <p id="newsletter-status" className={`min-h-5 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`} role="status" aria-live="polite">
                {error || message}
              </p>
            </form>
          </section>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-850 dark:text-zinc-450 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {new Date().getFullYear()} Scholarly Nest.</span>
            {legalPages.map((page) => (
              <Link key={page.id || page.slug} href={`/${page.slug}`} className="font-medium underline-offset-4 hover:text-zinc-950 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-white">
                {page.title}
              </Link>
            ))}
          </div>
          <button type="button" onClick={scrollToTop} className="inline-flex w-fit items-center gap-2 rounded-md px-3 py-2 font-semibold text-zinc-650 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white">
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
