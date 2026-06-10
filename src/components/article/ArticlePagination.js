import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ArticlePagination({ 
  previousArticleId,
  nextArticleId,
  previousArticleSlug, 
  nextArticleSlug, 
  previousArticleTitle, 
  nextArticleTitle, 
  magazineSlug 
}) {
  const router = useRouter();

  const handleNavigate = (id, slug) => {
    if (id && slug) {
      router.push(`/magazines/${magazineSlug}/articles/${id}/${slug}`);
    }
  };

  const truncateTitle = (title, limit = 55) => {
    if (!title) return '';
    if (title.length <= limit) return title;
    return title.substring(0, limit) + '...';
  };

  const prevTitleText = previousArticleTitle ? truncateTitle(previousArticleTitle, 55) : 'Read Previous';
  const nextTitleText = nextArticleTitle ? truncateTitle(nextArticleTitle, 55) : 'Read Next';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-12 border-t border-zinc-200 dark:border-zinc-800">
      {/* Previous Article Button / Placeholder */}
      {previousArticleSlug ? (
        <button
          onClick={() => handleNavigate(previousArticleId, previousArticleSlug)}
          className="group w-full sm:w-[280px] md:w-[320px] flex items-center justify-start space-x-3 px-5 py-4 rounded-xl text-left border border-zinc-200/85 dark:border-zinc-800/85 bg-white/50 dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--accent)] shrink-0 group-hover:-translate-x-0.5 transition-transform" />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--muted)] block">
              Previous Paper
            </span>
            <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block truncate" title={previousArticleTitle || ''}>
              {prevTitleText}
            </span>
          </div>
        </button>
      ) : (
        <div className="w-full sm:w-[280px] md:w-[320px] flex items-center justify-start space-x-3 px-5 py-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 opacity-60 select-none">
          <ChevronLeft className="w-5 h-5 text-zinc-400 dark:text-zinc-650 shrink-0" />
          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-550 block">
              Previous Limit
            </span>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 mt-0.5 block">
              Issue Limit Reached
            </span>
          </div>
        </div>
      )}

      {/* Next Article Button / Placeholder */}
      {nextArticleSlug ? (
        <button
          onClick={() => handleNavigate(nextArticleId, nextArticleSlug)}
          className="group w-full sm:w-[280px] md:w-[320px] flex items-center justify-end space-x-3 px-5 py-4 rounded-xl text-right border border-zinc-200/85 dark:border-zinc-800/85 bg-white/50 dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--muted)] block">
              Next Paper
            </span>
            <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block truncate" title={nextArticleTitle || ''}>
              {nextTitleText}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--accent)] shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      ) : (
        <div className="w-full sm:w-[280px] md:w-[320px] flex items-center justify-end space-x-3 px-5 py-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 opacity-60 select-none">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-550 block">
              Next Limit
            </span>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 mt-0.5 block">
              Issue Limit Reached
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-650 shrink-0" />
        </div>
      )}
    </div>
  );
}
