import React, { useMemo } from 'react';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { ArrowRight, Calendar, FileText, Library, User } from 'lucide-react';

function cleanHtml(html) {
  if (!html) return '';
  if (typeof window !== 'undefined') return DOMPurify.sanitize(html);
  return html;
}

function plainText(html) {
  return cleanHtml(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseMonthYear(key) {
  const [month, year] = String(key).split(' ');
  return { month, year: parseInt(year, 10) || new Date().getFullYear() };
}

function monthTime(monthKey) {
  const parsed = parseMonthYear(monthKey);
  return new Date(`${parsed.month} 1, ${parsed.year}`).getTime();
}

function formatDate(value) {
  if (!value) return 'Publication date pending';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function YearArchiveBlock({ groupedArticles = {}, onArticleClick }) {
  const archive = useMemo(() => {
    const years = Object.keys(groupedArticles).reduce((acc, monthKey) => {
      const { year } = parseMonthYear(monthKey);
      if (!acc[year]) acc[year] = [];
      acc[year].push(monthKey);
      return acc;
    }, {});

    return Object.keys(years)
      .sort((a, b) => Number(b) - Number(a))
      .map((year) => ({
        year,
        months: years[year].sort((a, b) => monthTime(b) - monthTime(a)),
      }));
  }, [groupedArticles]);

  const totalArticles = Object.values(groupedArticles).reduce((total, list) => total + list.length, 0);

  if (!archive.length) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-6 py-16 text-center">
        <Library className="mx-auto mb-4 h-9 w-9 text-[var(--muted)]" aria-hidden="true" />
        <h2 className="font-serif text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">No published articles yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-zinc-600 dark:text-zinc-350">Published articles will appear here by issue month and year once they are available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Table of Contents</p>
        <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">Published archive</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-350">
          Browse published articles by year and issue month. Each article row links to the full public record.
        </p>
        <p className="mt-4 text-sm font-semibold text-zinc-700 dark:text-zinc-250">{totalArticles} {totalArticles === 1 ? 'article' : 'articles'} across {archive.reduce((total, year) => total + year.months.length, 0)} issue groups.</p>
      </header>

      {archive.map((yearGroup) => (
        <section key={yearGroup.year} className="space-y-6" aria-labelledby={`toc-year-${yearGroup.year}`}>
          <h3 id={`toc-year-${yearGroup.year}`} className="font-serif text-2xl font-bold text-zinc-950 dark:text-white">{yearGroup.year}</h3>
          <div className="space-y-8">
            {yearGroup.months.map((monthKey) => {
              const articles = groupedArticles[monthKey] || [];
              return (
                <section key={monthKey} className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]" aria-labelledby={`toc-${monthKey.replace(/\s+/g, '-').toLowerCase()}`}>
                  <div className="flex flex-col gap-2 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <h4 id={`toc-${monthKey.replace(/\s+/g, '-').toLowerCase()}`} className="text-lg font-bold text-zinc-950 dark:text-white">{monthKey}</h4>
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-450">{articles.length} {articles.length === 1 ? 'article' : 'articles'}</span>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {articles.map((article) => {
                      const articleLink = `/articles/${article.slug}`;
                      const excerpt = plainText(article.abstract);
                      return (
                        <article key={article.id} className="px-5 py-5">
                          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                            <div className="min-w-0">
                              <Link href={articleLink} onClick={() => onArticleClick?.(article.id)} className="font-serif text-xl font-bold leading-snug text-zinc-950 underline-offset-4 hover:text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white dark:hover:text-amber-300">
                                {article.title}
                              </Link>
                              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-350">
                                <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" aria-hidden="true" />{authorNames(article)}</span>
                                <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" aria-hidden="true" />{article.published_month && article.published_year ? `${article.published_month} ${article.published_year}` : formatDate(article.published_at || article.created_at)}</span>
                                {article.has_pdf && <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4" aria-hidden="true" />PDF available</span>}
                              </div>
                              {excerpt && <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-350">{excerpt}</p>}
                            </div>
                            <div className="md:text-right">
                              <Link href={articleLink} onClick={() => onArticleClick?.(article.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-250 px-3 py-2 text-sm font-bold text-zinc-850 transition-colors hover:border-amber-500 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-750 dark:text-zinc-200 dark:hover:text-amber-300">
                                Read Article <ArrowRight className="h-4 w-4" aria-hidden="true" />
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
