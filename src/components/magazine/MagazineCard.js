import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText } from 'lucide-react';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  if (path.startsWith('/images/') || path.startsWith('images/')) return path.startsWith('/') ? path : `/${path}`;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}${cleanPath}`;
};

export default function MagazineCard({ title, slug, cover_image, description, articles_count }) {
  const articleCount = Number(articles_count || 0);

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-colors hover:border-amber-500/40 dark:border-zinc-850 dark:bg-zinc-950/60">
      <Link href={`/magazines/${slug}/about-and-overview`} className="relative block aspect-[4/3] overflow-hidden bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 dark:bg-zinc-900" aria-label={`View ${title}`}>
        {cover_image ? (
          <img src={getFullImageUrl(cover_image)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900">
            <BookOpen className="h-9 w-9 text-zinc-350 dark:text-zinc-650" aria-hidden="true" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-450">
          <FileText className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <span>{articleCount} {articleCount === 1 ? 'article' : 'articles'}</span>
        </div>
        <Link href={`/magazines/${slug}/about-and-overview`} className="mt-3 block focus:outline-none focus:ring-2 focus:ring-amber-500">
          <h3 className="font-serif text-xl font-bold leading-snug text-zinc-950 transition-colors group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">
            {title}
          </h3>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-350">
          {description || 'No public overview has been added for this magazine yet.'}
        </p>
        <Link href={`/magazines/${slug}/about-and-overview`} className="mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-amber-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-amber-300">
          View Magazine <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
