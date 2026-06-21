'use client';

import { logError } from '../../utils/safeLogger';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search as SearchIcon, Loader2, BookOpen, FileText, Globe, ArrowLeft, 
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

  useEffect(() => {
    if (q) {
      fetchSearchResults(q, activeTab, currentPage);
    } else {
      setResults([]);
      setTotalResults(0);
      setTotalPages(1);
    }
  }, [q, activeTab, currentPage]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Render a single polymorphic result row (compact editorial design)
  const renderRow = (item) => {
    switch (item.type) {
      case 'magazine':
        return (
          <div 
            key={`mag-${item.id}`} 
            className="group flex flex-col md:flex-row gap-6 py-6 border-b border-zinc-100 dark:border-zinc-900/60 transition-colors text-left"
          >
            {item.additional?.cover_image && (
              <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
                <img 
                  src={getFullImageUrl(item.additional.cover_image)} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              </div>
            )}
            <div className="flex-grow space-y-2.5 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-wider font-mono text-amber-700 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-md">
                  <BookOpen className="w-3 h-3 text-amber-500" />
                  <span>Magazine</span>
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                <Link href={item.target_url}>{item.title}</Link>
              </h3>
              {item.additional?.description && (
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed line-clamp-2">
                  {item.additional.description}
                </p>
              )}
              <div className="pt-1">
                <Link 
                  href={item.target_url} 
                  className="inline-flex items-center space-x-1 text-[10px] font-sans font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <span>Explore Issue</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        );

      case 'article':
        return (
          <div 
            key={`art-${item.id}`} 
            className="group flex flex-col gap-3 py-6 border-b border-zinc-100 dark:border-zinc-900/60 transition-colors text-left"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-wider font-mono text-blue-700 dark:text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded-md">
                <FileText className="w-3 h-3 text-blue-500" />
                <span>Article</span>
              </span>
              {item.additional?.magazine_title && (
                <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-500">
                  Published in {item.additional.magazine_title}
                </span>
              )}
            </div>
            
            <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              <Link href={item.target_url}>{item.title}</Link>
            </h3>
            
            {item.additional?.abstract && (
              <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed line-clamp-3">
                {item.additional.abstract}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1.5">
              <div className="flex items-center space-x-3 text-[10px] font-sans font-semibold text-zinc-450 dark:text-zinc-500">
                <span className="flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                  {item.additional?.author || 'Unknown Author'}
                </span>
              </div>
              
              <Link 
                href={item.target_url} 
                className="inline-flex items-center space-x-1 text-[10px] font-sans font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 transition-colors"
              >
                <span>Read Manuscript</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );

      default: // page (CMS or Magazine Custom Page)
        return (
          <div 
            key={`page-${item.id}`} 
            className="group flex flex-col gap-3 py-6 border-b border-zinc-100 dark:border-zinc-900/60 transition-colors text-left"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-wider font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-md">
                <Globe className="w-3 h-3 text-emerald-500" />
                <span>Public Page</span>
              </span>
              <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-500">
                Source: {item.additional?.source === 'magazine_page' ? 'Magazine Custom Section' : 'System Guidelines'}
              </span>
            </div>

            <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              <Link href={item.target_url}>{item.title}</Link>
            </h3>

            {item.additional?.description && (
              <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {item.additional.description}
              </p>
            )}

            <div className="pt-1">
              <Link 
                href={item.target_url} 
                className="inline-flex items-center space-x-1 text-[10px] font-sans font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 transition-colors"
              >
                <span>View Guidelines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
    }
  };

  const ShimmerLoader = () => (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((n) => (
        <div key={n} className="py-6 border-b border-zinc-100 dark:border-zinc-900/60 space-y-3">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
          <div className="h-5 bg-zinc-300 dark:bg-zinc-800 rounded w-3/4" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50/20 dark:bg-zinc-950/10 pb-24 font-sans text-left">
      <SeoHead
        title="Search Catalog — ScholarlyNest"
        description="Search articles, magazines, and dynamic pages on ScholarlyNest scientific dissemination platform."
        ogUrl="/search"
      />
      
      {/* 1. Centered Header & Search Box Input */}
      <div className="relative pt-32 pb-16 border-b border-zinc-100 dark:border-zinc-900/60 bg-white/60 dark:bg-zinc-900/20">
        <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30 space-y-6 text-center">
          
          <div className="flex justify-center">
            <Link 
              href="/" 
              className="inline-flex items-center space-x-1.5 text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-400 hover:text-amber-605 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </Link>
          </div>
          
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Search Scholarly Nest
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-xl mx-auto">
              Query the complete digital index of published research manuscripts, academic magazines, and platform guidelines.
            </p>
          </div>

          {/* Prominent centered search bar */}
          <div className="max-w-2xl mx-auto w-full pt-4">
            <GlobalSearchInput
              initialQuery={q || ''}
              onSearch={(newQuery) => {
                setCurrentPage(1);
                router.push(`/search?q=${encodeURIComponent(newQuery)}`);
              }}
              placeholder="Search by keywords, titles, authors..."
              className="!py-4 shadow-md bg-white dark:bg-zinc-905 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-amber-500/30"
            />
          </div>

        </div>
      </div>

      {/* 2. Main Search Results Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {q ? (
          <div className="space-y-6">
            
            {/* Filter Tabs & Count Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-150 dark:border-zinc-850/80 pb-4 gap-4">
              <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-100/80 dark:bg-zinc-900/40 rounded-xl border border-zinc-200/30 dark:border-zinc-850/50">
                {[
                  { id: 'all', label: 'All Results' },
                  { id: 'magazine', label: 'Magazines' },
                  { id: 'article', label: 'Manuscripts' },
                  { id: 'page', label: 'Guidelines' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-zinc-950 text-amber-600 dark:text-amber-400 shadow-sm border border-zinc-200/50 dark:border-zinc-850/50'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550 font-mono">
                Found <strong className="text-zinc-800 dark:text-zinc-200">{totalResults}</strong> records
              </span>
            </div>

            {/* Content Listing */}
            {loading ? (
              <ShimmerLoader />
            ) : error ? (
              <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-semibold text-xs leading-none">{error}</span>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-zinc-900/10 border border-zinc-200/60 dark:border-zinc-850/60 rounded-3xl p-8">
                <BookOpenText className="w-12 h-12 mx-auto text-zinc-350 dark:text-zinc-600 mb-3 opacity-60" />
                <h3 className="font-serif text-lg font-bold text-zinc-905 dark:text-zinc-150">No search records matching</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                  We couldn&apos;t find matching records for &ldquo;{q}&rdquo;. Verify spelling or try typing less specific parameters.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-900/60">
                  {results.map((item) => renderRow(item))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-2 pt-8 mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 font-mono">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          /* Empty Search Hero State */
          <div className="text-center py-24 bg-white/50 dark:bg-zinc-900/10 border border-zinc-200/40 dark:border-zinc-855 rounded-3xl p-8">
            <SearchIcon className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-200">Start Your Search Query</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mt-2 leading-relaxed">
              Enter any terms above to run a search across issues, authors, manuscripts, policies, or guide files.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50/20 dark:bg-zinc-950/10">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 animate-pulse" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
