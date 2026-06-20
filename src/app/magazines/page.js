'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ArrowRight, FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { logError } from '../../utils/safeLogger';
import MagazineCard from '../../components/magazine/MagazineCard';
import Pagination from '../../components/ui/Pagination';

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
        logError('Failed to load magazines', err);
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

      <div className="w-full space-y-12 relative z-10">
        
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
              <MagazineCard key={mag.id} {...mag} />
            ))}
          </div>
        )}

        {/* Centered Pagination Controls with appropriate spacing */}
        {!loading && !error && totalPages > 1 && (
          <div className="pt-12 pb-6 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}

      </div>
    </div>
  );
}
