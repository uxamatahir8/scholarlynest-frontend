'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { logError } from '../../utils/safeLogger';
import { formatDate } from '../../utils/date';
import { publicArticlePath } from '../../utils/articleLinks';

const stripHtml = (htmlString) => {
  if (!htmlString) return '';
  return htmlString
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
};

const getAuthorNames = (article) => {
  const articleAuthors = Array.isArray(article.article_authors) ? article.article_authors : [];
  const names = articleAuthors
    .slice()
    .sort((a, b) => (a.author_order || 0) - (b.author_order || 0))
    .map((author) => author.co_author_name)
    .filter(Boolean);

  if (names.length > 0) return names.join(', ');
  return article.user?.name || 'ScholarlyNest Author';
};

export default function RecentArticles({ publicationType = 'magazine' }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api.get('/articles/latest', { params: { limit: 10, publication_type: publicationType } })
      .then((response) => {
        if (!active) return;
        setArticles((response.data?.status === 'success' ? response.data.data : response.data) || []);
      })
      .catch((err) => {
        logError('Failed to load recent articles:', err);
        if (active) setError('Latest research is unavailable right now.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [publicationType]);

  if (loading) {
    return (
      <section className="border-t border-[var(--border)] bg-[var(--background)] py-14">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-center gap-3 px-4 text-sm font-semibold text-[var(--muted)] sm:px-6 lg:px-8">
          <Loader2 className="h-4 w-4 animate-spin text-amber-700" aria-hidden="true" />
          Loading latest research...
        </div>
      </section>
    );
  }

  if (error || articles.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-[var(--border)] bg-[var(--background)] py-16 lg:py-20" id={`latest-${publicationType}-research`}>
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.42fr_0.58fr] lg:px-8">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {publicationType === 'journal' ? 'Latest journal research' : 'Latest published magazine articles'}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            {publicationType === 'journal' ? 'Recently added journal articles' : 'Recently added to the archive'}
          </h2>
          <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-350">
            {publicationType === 'journal'
              ? 'Published articles from public journal archives, shown with author and publication context.'
              : 'Published articles from public magazine archives, shown with author and publication context.'}
          </p>
          <Link href="/search" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-300">
            Search all research <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {articles.slice(0, 5).map((article) => {
            const articleLink = publicArticlePath(article);
            const excerpt = stripHtml(article.abstract);
            const prefix = article.magazine?.publication_type === 'journal' ? 'journals' : 'magazines';
            return (
              <article key={article.id} className="py-5">
                {article.magazine && (
                  <Link href={`/${prefix}/${article.magazine.slug}/about-and-overview`} className="text-sm font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-300">
                    {article.magazine.title}
                  </Link>
                )}
                <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-zinc-950 dark:text-white">
                  <Link href={articleLink} className="underline-offset-4 hover:text-amber-700 hover:underline dark:hover:text-amber-300">
                    {article.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-350">
                  {getAuthorNames(article)}
                  {(article.published_at || article.created_at) && (
                    <span className="text-zinc-400"> · {formatDate(article.published_at || article.created_at)}</span>
                  )}
                </p>
                {excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-350">{excerpt}</p>
                )}
                <Link href={articleLink} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-300">
                  Read Article <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
