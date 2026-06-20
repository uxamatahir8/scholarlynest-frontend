'use client';

import { logError } from '../../utils/safeLogger';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Loader2, BookOpen, FileText, Globe, ArrowLeft, 
  ArrowRight, AlertCircle, Calendar, User, BookOpenText, X
} from 'lucide-react';
import api from '../../utils/api';
import GlobalSearchInput from '../../components/home/GlobalSearchInput';
import SeoHead from '../../components/SeoHead';
import Pagination from '../../components/ui/Pagination';

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

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams ? searchParams.get('q') : '';

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'magazine' | 'article' | 'page'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSearchResults = async (searchQuery, tab, page) => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(
        `/search/full?q=${encodeURIComponent(searchQuery)}&type=${tab}&page=${page}`
      );
      
      const data = response.data;
      setResults(data.data || []);
      setTotalResults(data.total || 0);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      logError('Error fetching search results:', err);
      setError('Could not query the index. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when search bounds, tab, or page changes
  useEffect(() => {
    if (q) {
      fetchSearchResults(q, activeTab, currentPage);
    }
  }, [q, activeTab, currentPage]);

  // Reset page when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'magazine':
        return <BookOpen className="w-5 h-5 text-[var(--accent-gold)]" />;
      case 'article':
        return <FileText className="w-5 h-5 text-blue-400" />;
      default:
        return <Globe className="w-5 h-5 text-emerald-400" />;
    }
  };

  // Render a single polymorphic result card
  const renderCard = (item) => {
    switch (item.type) {
      case 'magazine':
        return (
          <div key={`mag-${item.id}`} className="glass-panel p-6 border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 rounded-2xl flex flex-col md:flex-row gap-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group">
            {item.additional?.cover_image && (
              <div className="w-full md:w-28 h-36 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-md">
                <img src={getFullImageUrl(item.additional.cover_image)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            <div className="flex-grow space-y-3">
              <span className="inline-flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-wider font-mono text-[var(--accent-gold)] bg-[var(--accent-gold)]/5 border border-[var(--accent-gold)]/10 px-2 py-0.5 rounded">
                <BookOpen className="w-3 h-3" />
                <span>Magazine catalog</span>
              </span>
              <h3 className="font-serif text-lg font-bold text-zinc-950 dark:text-white leading-tight">
                {item.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {item.additional?.description}
              </p>
              <div className="pt-2">
                <Link href={item.target_url} className="inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline">
                  <span>View Catalog Issue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );

      case 'article':
        return (
          <div key={`art-${item.id}`} className="glass-panel p-6 border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 rounded-2xl space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-wider font-mono text-blue-500 dark:text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded">
                <FileText className="w-3 h-3" />
                <span>Research paper</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-[var(--muted)]">
                Issue: {item.additional?.magazine_title || 'General'}
              </span>
            </div>
            
            <h3 className="font-serif text-lg font-bold text-zinc-950 dark:text-white leading-tight">
              {item.title}
            </h3>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
              {item.additional?.abstract}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-150 dark:border-zinc-850/50">
              <div className="flex items-center space-x-3 text-[10px] font-mono font-bold text-[var(--muted)]">
                <span className="flex items-center">
                  <User className="w-3.5 h-3.5 mr-1" />
                  {item.additional?.author || 'Unknown Author'}
                </span>
              </div>
              
              <Link href={item.target_url} className="inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline">
                <span>Read Full Manuscript</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );

      default: // page (CMS or Magazine Custom Page)
        return (
          <div key={`page-${item.id}`} className="glass-panel p-6 border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 rounded-2xl space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-wider font-mono text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded">
                <Globe className="w-3 h-3" />
                <span>Guidelines page</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-[var(--muted)]">
                Source: {item.additional?.source === 'magazine_page' ? `Magazine: ${item.additional?.magazine_title}` : 'Platform Guidelines'}
              </span>
            </div>

            <h3 className="font-serif text-lg font-bold text-zinc-950 dark:text-white leading-tight">
              {item.title}
            </h3>

            {item.additional?.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {item.additional.description}
              </p>
            )}

            <div className="pt-2">
              <Link href={item.target_url} className="inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline">
                <span>View Guidelines Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
    }
  };

  const ShimmerLoader = () => (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((n) => (
        <div key={n} className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/40 dark:bg-zinc-900/40 space-y-3">
          <div className="h-4 bg-zinc-300 dark:bg-zinc-800 rounded w-1/3" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mt-2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 font-sans text-left">
      <SeoHead
        title="Search — ScholarlyNest"
        description="Search articles, magazines, and pages on ScholarlyNest scientific dissemination platform."
        ogUrl="/search"
      />
      {/* 1. Page Header Banner */}
      <div className="relative pt-32 pb-16 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 z-20">
        <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
        <div className="w-full px-4 sm:px-6 relative z-30 space-y-4">
          <Link href="/" className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] dark:text-[var(--accent-gold)] hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-950 dark:text-white tracking-tight leading-tight">
            Search Registry Catalog
          </h1>
          <p className="text-xs sm:text-sm text-zinc-505 dark:text-zinc-400 font-medium">
            Search dynamic publications index ledger, guideline directories, and digital content shells.
          </p>

          {/* Search bar inside header */}
          <div className="w-full max-w-2xl mt-6 text-left relative z-[9999]">
            <GlobalSearchInput
              initialQuery={q || ''}
              onSearch={(newQuery) => {
                setCurrentPage(1);
                router.push(`/search?q=${encodeURIComponent(newQuery)}`);
              }}
              placeholder="Search all magazines, research articles, policy papers..."
              className="!py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Main Content Dashboard */}
      <div className="w-full px-4 sm:px-6 mt-12 grid grid-cols-1 gap-8">
        {/* Category Tabs & Total Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-850 pb-4 gap-4">
          <div className="flex rounded-xl p-1 bg-black/5 dark:bg-white/5 border border-[var(--muted-border)]/60 max-w-md">
            {[
              { id: 'all', label: 'All Results' },
              { id: 'magazine', label: 'Magazines' },
              { id: 'article', label: 'Articles' },
              { id: 'page', label: 'Guidelines' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[var(--background)] shadow-md text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono font-bold text-[var(--muted)] shrink-0 self-end sm:self-center">
            Found <strong className="text-[var(--foreground)]">{totalResults}</strong> matching records
          </span>
        </div>

        {/* Query Results feed */}
        {loading ? (
          <ShimmerLoader />
        ) : error ? (
          <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-xs leading-none">{error}</span>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24 glass-panel border border-[var(--muted-border)]/60 rounded-3xl bg-[var(--card-bg)]">
            <BookOpenText className="w-16 h-16 mx-auto text-[var(--muted)] mb-4 opacity-55" />
            <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-150">No search records matching</h3>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto mt-1 leading-relaxed">
              We couldn&apos;t find matching records for &ldquo;{q}&rdquo;. Verify spelling or try typing less specific parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {results.map((item) => renderCard(item))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-2 pt-6 border-t border-zinc-200 dark:border-zinc-850">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550 font-mono">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] animate-pulse" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
