import React, { useState } from 'react';
import Link from 'next/link';
import { User, Calendar, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import MonthVolumeCard from './MonthVolumeCard';
import DOMPurify from 'dompurify';

export default function TableOfContents({ groupedArticles, coverImage, magazineSlug, onArticleClick }) {
  const months = Object.keys(groupedArticles || {});
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const currentYear = typeof window !== 'undefined' ? new Date().getFullYear() : 2026;

  // Helper to parse "M Y" keys (e.g. "Sep 2026")
  const parseMonthYear = (key) => {
    const parts = key.split(' ');
    return {
      month: parts[0],
      year: parseInt(parts[1], 10),
    };
  };

  // Helper to filter months for a given year
  const getMonthsForYear = (year) => {
    return months.filter((key) => {
      const parsed = parseMonthYear(key);
      return parsed.year === year;
    });
  };

  // Helper to list all years that exist in the articles data, excluding current year
  const getAvailableYears = () => {
    const yearsSet = new Set();
    months.forEach((key) => {
      const parsed = parseMonthYear(key);
      if (parsed.year !== currentYear) {
        yearsSet.add(parsed.year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a); // descending order
  };

  const availableYears = getAvailableYears();

  if (months.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-450 dark:text-zinc-550">
        <FileText className="w-12 h-12 mx-auto text-zinc-200 dark:text-zinc-800 mb-3" />
        <p className="text-sm font-semibold">No approved papers have been cataloged in this issue.</p>
      </div>
    );
  }

  // 1. Articles List View
  if (selectedMonth) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <button
            onClick={() => setSelectedMonth(null)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-gold)] transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Issues</span>
          </button>
        </div>

        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
            Publications in {selectedMonth}
          </h2>
          <span className="text-xs font-mono text-[var(--muted)] bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-full font-bold">
            {groupedArticles[selectedMonth]?.length || 0} {groupedArticles[selectedMonth]?.length === 1 ? 'Article' : 'Articles'}
          </span>
        </div>

        <div className="space-y-6">
          {groupedArticles[selectedMonth]?.map((art) => {
            const cleanAbstract = typeof window !== 'undefined' ? DOMPurify.sanitize(art.abstract) : art.abstract;
            
            return (
              <div
                key={art.id}
                className="group relative border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/60 p-5 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm"
              >
                <div className="space-y-3">
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-[var(--muted)] font-mono uppercase tracking-wider">
                    <span className="flex items-center text-zinc-550 dark:text-zinc-450">
                      <User className="w-3.5 h-3.5 mr-1" />
                      {art.user?.name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center text-zinc-550 dark:text-zinc-450">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {new Date(art.published_at || art.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[var(--accent)] transition-colors leading-snug">
                    <Link
                      href={`/magazines/${magazineSlug}/articles/${art.slug}`}
                      className="cursor-pointer hover:underline"
                      onClick={() => onArticleClick && onArticleClick(art.id)}
                    >
                      {art.title}
                    </Link>
                  </h4>

                  {/* Abstract short render */}
                  <div
                    className="text-xs text-zinc-650 dark:text-zinc-450 leading-relaxed line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: cleanAbstract }}
                  />

                  {/* Link Trigger */}
                  <div className="pt-2 flex justify-between items-center">
                    {art.pdf_path && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                        PDF Archive Loaded
                      </span>
                    )}
                    <Link
                      href={`/magazines/${magazineSlug}/articles/${art.slug}`}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] group-hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                      onClick={() => onArticleClick && onArticleClick(art.id)}
                    >
                      <span>Read Full Paper</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Specific Year View Layer
  if (selectedYear) {
    const yearMonths = getMonthsForYear(selectedYear);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <button
            onClick={() => setSelectedYear(null)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-gold)] transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Current Catalog</span>
          </button>
        </div>

        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
            Issues in {selectedYear}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Browse publications cataloged during the calendar year {selectedYear}.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {yearMonths.map((month) => (
            <MonthVolumeCard
              key={month}
              monthYear={month}
              coverImage={coverImage}
              isActive={false}
              onClick={() => setSelectedMonth(month)}
              articleCount={groupedArticles[month]?.length || 0}
            />
          ))}
        </div>
      </div>
    );
  }

  // 3. Default Start View Layer (Current Year Grid + Available Years Grid)
  const currentYearMonths = getMonthsForYear(currentYear);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Current Year Issue Grid */}
      <div className="space-y-6">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
            Table of Contents
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Latest publications for the calendar year {currentYear}.
          </p>
        </div>

        {currentYearMonths.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">No publications released in {currentYear}.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {currentYearMonths.map((month) => (
              <MonthVolumeCard
                key={month}
                monthYear={month}
                coverImage={coverImage}
                isActive={false}
                onClick={() => setSelectedMonth(month)}
                articleCount={groupedArticles[month]?.length || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Horizontal divider and Archives section */}
      {availableYears.length > 0 && (
        <div className="space-y-6">
          <hr className="border-zinc-200 dark:border-zinc-800 my-8" />
          
          <div className="pb-2">
            <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-white">
              Articles By year
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Access the complete historical research archives.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className="group flex flex-col items-center justify-center p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl hover:border-amber-500 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                <span className="text-xl font-bold font-serif text-zinc-800 dark:text-zinc-200 group-hover:text-amber-500 transition-colors">
                  {year}
                </span>
                <span className="text-[9px] font-mono mt-1 block text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  View Archives
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
