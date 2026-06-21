'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { ArrowRight, Calendar, FileText, Library, User, BookOpen } from 'lucide-react';

const MONTH_ORDER = {
  'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
  'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
};

function cleanHtml(html) {
  if (!html) return '';
  if (typeof window !== 'undefined') return DOMPurify.sanitize(html);
  return html;
}

function plainText(html) {
  return cleanHtml(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(value) {
  if (!value) return 'Publication date pending';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function authorNames(article) {
  const authors = Array.isArray(article.article_authors) ? article.article_authors : [];
  const names = authors
    .slice()
    .sort((a, b) => (a.author_order || 0) - (b.author_order || 0))
    .map((author) => author.co_author_name)
    .filter(Boolean);
  if (names.length > 0) return names.join(', ');
  return article.user?.name || 'ScholarlyNest Author';
}

export default function YearArchiveBlock({ archive = {}, onArticleClick }) {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Get sorted list of years
  const sortedYears = useMemo(() => {
    return Object.keys(archive).sort((a, b) => Number(b) - Number(a));
  }, [archive]);

  // Set default selection
  useEffect(() => {
    if (sortedYears.length > 0) {
      const defaultYear = sortedYears[0];
      setSelectedYear(defaultYear);

      const months = Object.keys(archive[defaultYear] || {}).sort((a, b) => MONTH_ORDER[b] - MONTH_ORDER[a]);
      setSelectedMonth(months[0] || null);
    } else {
      setSelectedYear(null);
      setSelectedMonth(null);
    }
  }, [archive, sortedYears]);

  // Handle year selection
  const handleYearChange = (year) => {
    setSelectedYear(year);
    const months = Object.keys(archive[year] || {}).sort((a, b) => MONTH_ORDER[b] - MONTH_ORDER[a]);
    setSelectedMonth(months[0] || null);
  };

  // Get articles for current selection
  const selectedArticles = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    return archive[selectedYear]?.[selectedMonth] || [];
  }, [archive, selectedYear, selectedMonth]);

  if (sortedYears.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-6 py-16 text-center">
        <Library className="mx-auto mb-4 h-9 w-9 text-[var(--muted)]" aria-hidden="true" />
        <h2 className="font-serif text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">No published articles yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-zinc-600 dark:text-zinc-350">
          Published articles will appear here by year and issue month once they are available.
        </p>
      </div>
    );
  }

  // Get months for selected year
  const availableMonths = selectedYear && archive[selectedYear]
    ? Object.keys(archive[selectedYear]).sort((a, b) => MONTH_ORDER[b] - MONTH_ORDER[a])
    : [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <header className="border-b border-[var(--border)] pb-6 text-left">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Archive Index</p>
        <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">Magazine Archive</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-650 dark:text-zinc-300">
          Browse our complete historical repository of published papers, peer-reviewed articles, and research releases by year and month.
        </p>
      </header>

      {/* Mobile Selector UX */}
      <div className="block md:hidden space-y-4 text-left">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="archive-year-select" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Select Year
            </label>
            <select
              id="archive-year-select"
              value={selectedYear || ''}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
            >
              {sortedYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="archive-month-select" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Select Month
            </label>
            <select
              id="archive-month-select"
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
              disabled={availableMonths.length === 0}
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Split-Screen Layout */}
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">

        {/* Desktop Left Sidebar Navigation */}
        <nav className="hidden md:block text-left" aria-label="Archive navigation">
          <div className="space-y-6 sticky top-36">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-[var(--border)] pb-2">
              Publication Years
            </h3>
            <ul className="space-y-2">
              {sortedYears.map((year) => {
                const isYearSelected = selectedYear === year;
                const monthsInYear = Object.keys(archive[year] || {}).sort((a, b) => MONTH_ORDER[b] - MONTH_ORDER[a]);

                return (
                  <li key={year} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleYearChange(year)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-[var(--surface-muted)] cursor-pointer ${
                        isYearSelected
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                      aria-expanded={isYearSelected}
                    >
                      <span>{year}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isYearSelected ? 'bg-amber-200/50 dark:bg-amber-400/20' : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}>
                        {monthsInYear.length} {monthsInYear.length === 1 ? 'month' : 'months'}
                      </span>
                    </button>

                    {/* Sub-menu of months for the selected year */}
                    {isYearSelected && (
                      <ul className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-amber-300 dark:border-amber-700/60 ml-3">
                        {monthsInYear.map((month) => {
                          const isMonthSelected = selectedMonth === month;
                          const count = archive[year][month].length;

                          return (
                            <li key={month}>
                              <button
                                type="button"
                                onClick={() => setSelectedMonth(month)}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer ${
                                  isMonthSelected
                                    ? 'text-amber-700 font-bold dark:text-amber-300 bg-amber-50/40 dark:bg-amber-500/5'
                                    : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                              >
                                <span>{month}</span>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                  ({count})
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Selected Month Content Area */}
        <main className="space-y-6 text-left" aria-labelledby="archive-current-title">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-4 gap-4">
            <div>
              <h3 id="archive-current-title" className="font-serif text-2xl font-bold text-zinc-950 dark:text-white leading-tight">
                {selectedMonth} {selectedYear} Publications
              </h3>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
                Displaying approved scholarly papers and reports released during this month.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-450 bg-zinc-100 dark:bg-zinc-800/60 px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-center">
              {selectedArticles.length} {selectedArticles.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          {/* Articles list */}
          {selectedArticles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-6 py-12 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]" aria-hidden="true" />
              <h4 className="font-serif text-lg font-bold text-zinc-900 dark:text-white">No articles available</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                There are no published manuscripts registered under this year and month.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[var(--surface)] rounded-xl overflow-hidden shadow-sm">
              {selectedArticles.map((article) => {
                const articleLink = `/articles/${article.slug}`;
                const excerpt = plainText(article.abstract);

                return (
                  <article key={article.id} className="p-6 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <div className="min-w-0 space-y-3">
                        <Link
                          href={articleLink}
                          onClick={() => onArticleClick?.(article.id)}
                          className="block font-serif text-xl font-bold leading-snug text-zinc-950 hover:text-amber-700 dark:text-white dark:hover:text-amber-300 transition-colors focus:outline-none focus:underline"
                        >
                          {article.title}
                        </Link>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-550 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                            {authorNames(article)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                            {formatDate(article.published_at || article.created_at)}
                          </span>
                          {article.has_pdf && (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 normal-case font-sans">
                              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                              PDF Available
                            </span>
                          )}
                        </div>

                        {excerpt && (
                          <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-300 line-clamp-3">
                            {excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center shrink-0 self-start md:self-center">
                        <Link
                          href={articleLink}
                          onClick={() => onArticleClick?.(article.id)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-250 bg-white px-4 py-2 text-xs font-bold text-zinc-805 transition-all hover:bg-zinc-50 hover:border-amber-500 hover:text-amber-750 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-amber-300"
                        >
                          Read Paper <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
