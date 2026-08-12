import React from 'react';
import { BookOpen } from 'lucide-react';

export default function MonthVolumeCard({ monthYear, coverImage, isActive, onClick, articleCount }) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full aspect-[1/1.414] rounded-2xl overflow-hidden cursor-pointer border text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none ${
        isActive
          ? 'border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)]/60 shadow-lg scale-[1.02]'
          : 'border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900 hover:shadow-md'
      }`}
    >
      {/* Background Cover Image or Placeholder */}
      {coverImage ? (
        <img
          src={coverImage}
          alt={monthYear}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 pointer-events-none">
          <BookOpen className="w-8 h-8 text-zinc-650" />
        </div>
      )}

      {/* Dark Tailwind gradient wrapper overlay for maximum contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/70 to-transparent pointer-events-none" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 text-white pointer-events-none">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--accent-gold)] bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 px-2 py-0.5 rounded w-fit mb-1.5 backdrop-blur-sm">
          {articleCount} {articleCount === 1 ? 'Paper' : 'Papers'}
        </span>
        <h3 className="font-serif text-base sm:text-lg font-bold tracking-tight text-white leading-snug drop-shadow-sm">
          {monthYear}
        </h3>
      </div>
    </button>
  );
}
