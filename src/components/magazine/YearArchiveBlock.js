import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import {
  ArrowRight,
  BookOpenText,
  Calendar,
  FileText,
  GraduationCap,
  Library,
  ListChecks,
  User,
} from 'lucide-react';
import MonthTextCard from './MonthTextCard';

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
  if (!value) return 'Date pending';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function YearArchiveBlock({ groupedArticles = {}, magazineSlug, onArticleClick }) {
  const archive = useMemo(() => {
    const grouped = Object.keys(groupedArticles).reduce((acc, monthKey) => {
      const parsed = parseMonthYear(monthKey);
      if (!acc[parsed.year]) acc[parsed.year] = [];
      acc[parsed.year].push(monthKey);
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => Number(b) - Number(a))
      .map((year) => {
        const months = grouped[year].sort((a, b) => monthTime(b) - monthTime(a));
        const articles = months.flatMap((month) => groupedArticles[month] || []);
        return { year, months, articles, articleCount: articles.length };
      });
  }, [groupedArticles]);

  const [selectedYear, setSelectedYear] = useState(archive[0]?.year || null);
  const selectedYearData = archive.find((item) => item.year === selectedYear) || archive[0];
  const [selectedMonth, setSelectedMonth] = useState(selectedYearData?.months?.[0] || null);

  const activeMonth = selectedYearData?.months?.includes(selectedMonth)
    ? selectedMonth
    : selectedYearData?.months?.[0];
  const monthArticles = activeMonth ? (groupedArticles[activeMonth] || []) : [];
  const totalArticles = archive.reduce((total, year) => total + year.articleCount, 0);
  const totalIssues = archive.reduce((total, year) => total + year.months.length, 0);

  if (!archive.length) {
    return (
      <div className="border border-dashed border-zinc-200/80 bg-zinc-50/20 rounded-2xl px-6 py-16 text-center dark:border-zinc-800/80 dark:bg-zinc-900/10">
        <Library className="mx-auto mb-4 h-10 w-10 text-zinc-350 dark:text-zinc-700" />
        <h3 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Archive awaiting publication</h3>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">No approved research manuscripts have been cataloged in this issue yet.</p>
      </div>
    );
  }

  const handleYearSelect = (year) => {
    const nextYear = archive.find((item) => item.year === year);
    setSelectedYear(year);
    setSelectedMonth(nextYear?.months?.[0] || null);
  };

  return (
    <div className="space-y-12">
      <header className="border-b border-zinc-100 dark:border-zinc-900/60 pb-8 space-y-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.03] px-3.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <GraduationCap className="h-3.5 w-3.5" /> Academic registry archive
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Table of Contents</h2>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Browse publications through a structured chronological registry. Select a year and issue month below to access full manuscripts.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-10 text-left pt-2 font-sans">
          <div>
            <p className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">{totalArticles}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Papers</p>
          </div>
          <div className="h-8 w-px bg-zinc-150 dark:bg-zinc-850" />
          <div>
            <p className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">{totalIssues}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Issues</p>
          </div>
          <div className="h-8 w-px bg-zinc-150 dark:bg-zinc-850" />
          <div>
            <p className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">{archive.length}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Years</p>
          </div>
        </div>
      </header>

      {/* Step 1: Select year */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">01. Select Year</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {archive.map((item) => (
            <button
              key={item.year}
              type="button"
              onClick={() => handleYearSelect(item.year)}
              className={`min-w-[120px] rounded-xl border px-5 py-4 text-left transition-all duration-300 cursor-pointer ${
                selectedYear === item.year
                  ? 'border-amber-500/30 bg-amber-500/[0.04] text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'border-zinc-200/80 bg-white text-zinc-700 hover:border-amber-500/20 hover:bg-amber-500/[0.01] dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-350'
              }`}
            >
              <span className="block font-serif text-3xl font-bold tracking-tight">{item.year}</span>
              <span className="mt-1 block text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400">{item.articleCount} papers</span>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Choose Month */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">02. Choose Issue</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {selectedYearData?.months.map((month) => (
            <MonthTextCard
              key={month}
              monthYear={month}
              articleCount={groupedArticles[month]?.length || 0}
              active={activeMonth === month}
              onClick={() => setSelectedMonth(month)}
            />
          ))}
        </div>
      </section>

      {/* Step 3: Manuscripts list */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150/60 dark:border-zinc-850 pb-4">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">03. Manuscript registry</span>
            <h3 className="mt-1 font-serif text-2xl font-bold text-zinc-900 dark:text-white">{activeMonth}</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-500">
            <ListChecks className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            {monthArticles.length} {monthArticles.length === 1 ? 'manuscript' : 'manuscripts'}
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {monthArticles.map((article, index) => (
            <article key={article.id} className="group py-6 transition-colors first:pt-0 last:pb-0 text-left">
              <div className="grid gap-5 md:grid-cols-[64px_1fr]">
                {/* Index badge */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50/50 font-serif text-lg font-bold text-zinc-400 dark:border-zinc-850 dark:bg-zinc-900/20 select-none">
                  {String(index + 1).padStart(2, '0')}
                </div>
                
                {/* Content block */}
                <div className="min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] font-sans font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
                    <span className="flex items-center gap-1"><BookOpenText className="h-3.5 w-3.5" />Research Article</span>
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{article.user?.name || 'ScholarlyNest Author'}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {article.published_month && article.published_year
                        ? `${article.published_month} ${article.published_year}`
                        : formatDate(article.published_at || article.created_at)}
                    </span>
                    {article.pdf_path && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450"><FileText className="h-3.5 w-3.5" />PDF available</span>}
                  </div>
                  
                  <Link
                    href={`/articles/${article.slug}`}
                    onClick={() => onArticleClick && onArticleClick(article.id)}
                    className="block font-serif text-xl sm:text-2xl font-bold leading-snug tracking-tight text-zinc-900 hover:text-amber-600 dark:text-white dark:hover:text-amber-400 transition-colors"
                  >
                    {article.title}
                  </Link>
                  
                  <p className="max-w-4xl text-xs sm:text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-3">
                    {plainText(article.abstract) || 'No abstract summary provided.'}
                  </p>
                  
                  <Link
                    href={`/articles/${article.slug}`}
                    onClick={() => onArticleClick && onArticleClick(article.id)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold uppercase tracking-wider text-amber-600 dark:text-amber-405 group-hover:underline"
                  >
                    Open manuscript <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
