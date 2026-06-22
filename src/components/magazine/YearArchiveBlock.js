'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText } from 'lucide-react';
import { formatDate } from '../../utils/date';

const monthIndex = (month) => {
  if (!month) return -1;
  const date = new Date(`${month} 1, 2000`);
  return Number.isNaN(date.getTime()) ? -1 : date.getMonth();
};

const plainText = (html = '') => html
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const authorNames = (article) => {
  const authors = Array.isArray(article.article_authors) ? article.article_authors : [];
  const names = authors
    .slice()
    .sort((a, b) => (a.author_order || 0) - (b.author_order || 0))
    .map((author) => author.co_author_name)
    .filter(Boolean);

  if (names.length > 0) return names.join(', ');
  return article.user?.name || 'Scholarly Nest Author';
};

const issueLabel = (article) => {
  const issue = article.issue;
  if (!issue) return '';
  const parts = [];
  if (issue.volume_number) parts.push(`Volume ${issue.volume_number}`);
  if (issue.issue_number) parts.push(`Issue ${issue.issue_number}`);
  if (issue.special_title) parts.push(issue.special_title);
  return parts.join(' - ');
};

export default function YearArchiveBlock({ archive = {}, onArticleClick }) {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const years = useMemo(() => (
    Object.keys(archive).sort((a, b) => Number(b) - Number(a))
  ), [archive]);

  const monthsForYear = useMemo(() => {
    if (!selectedYear || !archive[selectedYear]) return [];
    return Object.keys(archive[selectedYear]).sort((a, b) => monthIndex(b) - monthIndex(a));
  }, [archive, selectedYear]);

  useEffect(() => {
    if (years.length === 0) {
      setSelectedYear('');
      setSelectedMonth('');
      return;
    }

    const nextYear = years.includes(selectedYear) ? selectedYear : years[0];
    const months = Object.keys(archive[nextYear] || {}).sort((a, b) => monthIndex(b) - monthIndex(a));
    setSelectedYear(nextYear);
    setSelectedMonth((month) => (months.includes(month) ? month : months[0] || ''));
  }, [archive, selectedYear, years]);

  const selectedArticles = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    return archive[selectedYear]?.[selectedMonth] || [];
  }, [archive, selectedMonth, selectedYear]);

  const articleCountForYear = selectedYear
    ? Object.values(archive[selectedYear] || {}).reduce((sum, articles) => sum + articles.length, 0)
    : 0;

  if (years.length === 0) {
    return (
      <div className="border-y border-[var(--border)] px-4 py-16 text-center">
        <BookOpen className="mx-auto mb-4 h-9 w-9 text-[var(--muted)]" aria-hidden="true" />
        <h2 className="font-serif text-2xl font-bold text-zinc-950 dark:text-white">No published articles yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-zinc-600 dark:text-zinc-350">
          Published articles will appear here by year and issue month once they are available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="grid gap-6 border-b border-[var(--border)] pb-8 lg:grid-cols-[0.36fr_0.64fr]">
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Publication archive</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-950 dark:text-white sm:text-4xl">Browse published articles</h2>
        </div>
        <p className="max-w-3xl text-base leading-8 text-zinc-650 dark:text-zinc-300">
          Select a year and issue month to read published articles from this magazine. The newest available period is selected by default.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[220px_1fr]" aria-label="Archive period controls">
        <div>
          <label htmlFor="archive-year-select" className="block text-sm font-bold text-zinc-950 dark:text-white">
            Publication year
          </label>
          <select
            id="archive-year-select"
            value={selectedYear}
            onChange={(event) => {
              const nextYear = event.target.value;
              const months = Object.keys(archive[nextYear] || {}).sort((a, b) => monthIndex(b) - monthIndex(a));
              setSelectedYear(nextYear);
              setSelectedMonth(months[0] || '');
            }}
            className="mt-2 min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="archive-month-select" className="block text-sm font-bold text-zinc-950 dark:text-white">
            Issue month
          </label>
          <select
            id="archive-month-select"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {monthsForYear.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </section>

      <section aria-labelledby="archive-current-title">
        <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 id="archive-current-title" className="font-serif text-2xl font-bold text-zinc-950 dark:text-white">
              {selectedMonth} {selectedYear}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {articleCountForYear} published {articleCountForYear === 1 ? 'article' : 'articles'} in {selectedYear}
            </p>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {selectedArticles.length} in selected month
          </p>
        </div>

        {selectedArticles.length === 0 ? (
          <div className="border-b border-[var(--border)] py-12">
            <h4 className="font-serif text-xl font-bold text-zinc-950 dark:text-white">No published articles for this month</h4>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-350">
              Choose another issue month or publication year to continue browsing.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {selectedArticles.map((article) => {
              const articleLink = `/articles/${article.slug}`;
              const excerpt = plainText(article.abstract);
              const context = issueLabel(article);

              return (
                <article key={article.id} className="py-6">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      {context && <p className="text-sm text-zinc-500 dark:text-zinc-400">{context}</p>}
                      <h4 className="mt-2 font-serif text-2xl font-bold leading-snug text-zinc-950 dark:text-white">
                        <Link href={articleLink} onClick={() => onArticleClick?.(article.id)} className="underline-offset-4 hover:text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:hover:text-amber-300">
                          {article.title}
                        </Link>
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-350">
                        {authorNames(article)}
                        {(article.published_at || article.created_at) && (
                          <span className="text-zinc-400"> - {formatDate(article.published_at || article.created_at)}</span>
                        )}
                      </p>
                      {excerpt && <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-350">{excerpt}</p>}
                      {article.has_pdf && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                          <FileText className="h-4 w-4 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                          Public PDF available
                        </p>
                      )}
                    </div>
                    <div className="flex items-start lg:items-center">
                      <Link href={articleLink} onClick={() => onArticleClick?.(article.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                        Read Article <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
