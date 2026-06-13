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
      router.push(`/articles/${slug}`);
    }
  };

  const truncateTitle = (title, limit = 50) => {
    if (!title) return '';
    if (title.length <= limit) return title;
    return title.substring(0, limit) + '...';
  };

  const prevTitleText = previousArticleTitle ? truncateTitle(previousArticleTitle, 50) : 'Read Previous';
  const nextTitleText = nextArticleTitle ? truncateTitle(nextArticleTitle, 50) : 'Read Next';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full font-sans">
      
      {/* Previous Article */}
      {previousArticleSlug ? (
        <button
          onClick={() => handleNavigate(previousArticleId, previousArticleSlug)}
          className="group w-full sm:w-[280px] md:w-[320px] flex items-center justify-start space-x-3.5 px-5 py-4 rounded-xl text-left border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 hover:border-amber-500/20 hover:bg-amber-500/[0.01] transition-all duration-300 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-amber-600 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">
              Previous Paper
            </span>
            <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block truncate font-serif" title={previousArticleTitle || ''}>
              {prevTitleText}
            </span>
          </div>
        </button>
      ) : (
        <div className="w-full sm:w-[280px] md:w-[320px] flex items-center justify-start space-x-3.5 px-5 py-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-900/10 opacity-50 select-none">
          <ChevronLeft className="w-5 h-5 text-zinc-350 shrink-0" />
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">
              Previous Limit
            </span>
            <span className="text-xs font-bold text-zinc-400 mt-0.5 block font-serif">
              Registry Bound
            </span>
          </div>
        </div>
      )}

      {/* Next Article */}
      {nextArticleSlug ? (
        <button
          onClick={() => handleNavigate(nextArticleId, nextArticleSlug)}
          className="group w-full sm:w-[280px] md:w-[320px] flex items-center justify-end space-x-3.5 px-5 py-4 rounded-xl text-right border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 hover:border-amber-500/20 hover:bg-amber-500/[0.01] transition-all duration-300 cursor-pointer"
        >
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">
              Next Paper
            </span>
            <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block truncate font-serif" title={nextArticleTitle || ''}>
              {nextTitleText}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      ) : (
        <div className="w-full sm:w-[280px] md:w-[320px] flex items-center justify-end space-x-3.5 px-5 py-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-900/10 opacity-50 select-none">
          <div className="text-right">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">
              Next Limit
            </span>
            <span className="text-xs font-bold text-zinc-400 mt-0.5 block font-serif">
              Registry Bound
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-350 shrink-0" />
        </div>
      )}
    </div>
  );
}
