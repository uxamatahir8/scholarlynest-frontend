import React from 'react';
import { CalendarDays, FileText } from 'lucide-react';

export default function MonthTextCard({ monthYear, articleCount = 0, active = false, onClick }) {
  const [month, year] = String(monthYear).split(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-xl border px-5 py-4 text-left transition-all duration-300 cursor-pointer ${
        active
          ? 'border-amber-500/30 bg-amber-500/[0.04] shadow-sm'
          : 'border-zinc-200/80 bg-white hover:border-amber-500/20 hover:bg-amber-500/[0.01] dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:bg-amber-500/[0.02]'
      }`}
    >
      <div className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${active ? 'border-amber-500/20 bg-white dark:bg-zinc-950 text-amber-600' : 'border-zinc-150 bg-zinc-50/50 text-zinc-400 dark:border-zinc-850 dark:bg-zinc-900/40 dark:text-zinc-500'} transition-colors duration-300`}>
            <CalendarDays className="h-4.5 w-4.5" />
          </span>
          <div className="text-left">
            <span className="block font-serif text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">{month}</span>
            <span className="mt-0.5 block text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400">{year} academic issue</span>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-500 sm:inline-flex bg-zinc-50/50 dark:bg-zinc-950/20">
          <FileText className="h-3.5 w-3.5 text-amber-600" />
          {articleCount} {articleCount === 1 ? 'entry' : 'entries'}
        </span>
      </div>
    </button>
  );
}
