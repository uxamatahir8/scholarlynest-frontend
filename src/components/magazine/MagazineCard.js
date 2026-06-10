import React from 'react';
import Link from 'next/link';
import { BookOpen, FileText, ArrowRight } from 'lucide-react';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/images/') || path.startsWith('images/')) {
    return path.startsWith('/') ? path : '/' + path;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${domain}${cleanPath}`;
};

export default function MagazineCard({ id, title, slug, cover_image, description, articles_count }) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 w-full">
      {/* Visual Cover Top Banner */}
      <Link 
        href={`/magazines/${slug}`}
        className="block relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
      >
        {cover_image ? (
          <img 
            src={getFullImageUrl(cover_image)} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-150 to-zinc-250 dark:from-zinc-800 dark:to-zinc-900">
            <BookOpen className="w-10 h-10 text-zinc-400" />
          </div>
        )}
        {/* Absolute Badge: Published Articles Count */}
        <div className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur shadow-sm border border-zinc-100/50 dark:border-zinc-800/50 z-10">
          <FileText className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
          <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">
            {articles_count} {articles_count === 1 ? 'Paper' : 'Papers'}
          </span>
        </div>
      </Link>

      {/* Body Content */}
      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link href={`/magazines/${slug}`} className="block group-hover:text-[var(--accent)] transition-colors hover:underline">
            <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-white leading-snug line-clamp-1 cursor-pointer">
              {title}
            </h3>
          </Link>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-3">
            {description || 'No summary overview provided for this scientific magazine.'}
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--accent-gold)]">
            ISSN ARCHIVE
          </span>
          <Link
            href={`/magazines/${slug}`}
            className="inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
          >
            <span>Enter</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
