'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ArrowRight, FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

export default function MagazinesRegistry() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchMagazines = async () => {
      try {
        setLoading(true);
        const response = await api.get('/magazines', {
          params: { page, per_page: 8 }
        });
        setMagazines(response.data.data || []);
        setTotalPages(response.data.last_page || 1);
        
        // Smooth scroll to top on page change
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        console.error('Failed to load magazines', err);
        setError('We were unable to load the scientific magazines registry at this time.');
      } finally {
        setLoading(false);
      }
    };
    fetchMagazines();
  }, [page]);

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 sm:px-6 lg:px-8 py-12 font-sans relative overflow-hidden">
      <title>Scientific Magazines - ScholarlyNest</title>
      
      {/* Ambient background glows */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--accent-gold)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-gold)] font-mono">
            Scholarly Publications Catalog
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white leading-tight">
            Explore Scientific & Technical Magazines
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-medium">
            Browse our curated collections of articles, academic findings, and technological telemetry archives published across global science domains.
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-gold)] mx-auto rounded-full mt-4" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest font-mono">
              Loading Research Indexes...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && magazines.length === 0 && (
          <div className="text-center py-20 text-zinc-455">
            <BookOpen className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
            <p className="text-sm font-semibold">No magazines have been registered yet.</p>
          </div>
        )}

        {/* Grid Layout (4 cards per row) */}
        {!loading && !error && magazines.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {magazines.map((mag) => (
              <div 
                key={mag.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* Visual Cover Top Banner */}
                <Link 
                  href={`/magazines/${mag.slug}`}
                  className="block relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
                >
                  {mag.cover_image ? (
                    <img 
                      src={mag.cover_image} 
                      alt={mag.title}
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
                      {mag.articles_count} {mag.articles_count === 1 ? 'Paper' : 'Papers'}
                    </span>
                  </div>
                </Link>

                {/* Body Content */}
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <Link href={`/magazines/${mag.slug}`} className="block group-hover:text-[var(--accent)] transition-colors hover:underline">
                      <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-white leading-snug line-clamp-1 cursor-pointer">
                        {mag.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-3">
                      {mag.description || 'No summary overview provided for this scientific magazine.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--accent-gold)]">
                      ISSN ARCHIVE
                    </span>
                    <Link
                      href={`/magazines/${mag.slug}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                    >
                      <span>Enter</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Centered Pagination Controls with appropriate spacing */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 pt-12 pb-6 animate-in fade-in duration-300">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-zinc-900 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                  page === p
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-zinc-900 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
