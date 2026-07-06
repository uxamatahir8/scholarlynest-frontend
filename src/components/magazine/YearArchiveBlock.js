'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText } from 'lucide-react';
import { formatDate } from '../../utils/date';

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
    Object.keys(archive || {}).sort((a, b) => Number(b) - Number(a))
  ), [archive]);

  const monthsForYear = useMemo(() => {
    if (!selectedYear || !archive[selectedYear]) return [];
    const months = archive[selectedYear]?.months || {};
    return Object.keys(months).sort((a, b) => Number(b) - Number(a));
  }, [archive, selectedYear]);

  useEffect(() => {
    if (years.length === 0) {
      setSelectedYear('');
      setSelectedMonth('');
      return;
    }

    const nextYear = years.includes(selectedYear) ? selectedYear : years[0];
    const months = Object.keys(archive[nextYear]?.months || {}).sort((a, b) => Number(b) - Number(a));
    setSelectedYear(nextYear);
    setSelectedMonth((month) => (months.includes(month) ? month : months[0] || ''));
  }, [archive, selectedYear, years]);

  const selectedArticles = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    return archive[selectedYear]?.months?.[selectedMonth]?.articles || [];
  }, [archive, selectedMonth, selectedYear]);

  const articleCountForYear = selectedYear
    ? Object.values(archive[selectedYear]?.months || {}).reduce((sum, month) => sum + (month.articles?.length || 0), 0)
    : 0;

  const countForYear = (year) => Object.values(archive[year]?.months || {}).reduce((sum, month) => sum + (month.articles?.length || 0), 0);

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

      <section className="space-y-6" aria-label="Archive period controls">
        <div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-white">Choose a publication year</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {years.map((year) => {
              const active = selectedYear === year;
              const yearLabel = archive[year]?.year || year;
              return (
                <button
                  key={year}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    const months = Object.keys(archive[year]?.months || {}).sort((a, b) => Number(b) - Number(a));
                    setSelectedYear(year);
                    setSelectedMonth(months[0] || '');
                  }}
                  className={`min-h-24 rounded-md px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    active
                      ? 'bg-[var(--surface-muted)] text-zinc-950 shadow-[inset_0_-2px_0_rgba(180,83,9,0.8)] dark:text-white'
                      : 'bg-[var(--surface)] text-zinc-700 hover:bg-[var(--surface-muted)] dark:text-zinc-250'
                  }`}
                >
                  <span className="block font-serif text-3xl font-bold">{yearLabel}</span>
                  <span className="mt-2 block text-sm text-zinc-500 dark:text-zinc-400">
                    {countForYear(year)} published {countForYear(year) === 1 ? 'article' : 'articles'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-white">Choose an issue month</h3>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {monthsForYear.map((month) => {
              const active = selectedMonth === month;
              const monthGroup = archive[selectedYear]?.months?.[month];
              return (
                <button
                  key={month}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedMonth(month)}
                  className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    active
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                      : 'bg-[var(--surface)] text-zinc-650 hover:bg-[var(--surface-muted)] dark:text-zinc-300'
                  }`}
                >
                  {monthGroup?.month_name || month}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="archive-current-title">
        <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 id="archive-current-title" className="font-serif text-2xl font-bold text-zinc-950 dark:text-white">
              {archive[selectedYear]?.months?.[selectedMonth]?.month_name || selectedMonth} {archive[selectedYear]?.year || selectedYear}
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
                        <Link href={articleLink} onClick={() => onArticleClick?.(article.id)} className="underline-offset-4 hover:text-amber-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-amber-300">
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
                      <Link href={articleLink} onClick={() => onArticleClick?.(article.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
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
