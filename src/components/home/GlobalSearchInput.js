'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, BookOpen, FileText, Globe, ArrowRight, X } from 'lucide-react';
import api from '../../utils/api';

export default function GlobalSearchInput({
  initialQuery = '',
  placeholder = 'Search all magazines, research articles, policy papers...',
  className = '',
  onSearch = null,
  size = 'normal'
}) {
  const router = useRouter();
  const isCompact = size === 'sm';
  const [query, setQuery] = useState(initialQuery || '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Sync state if initialQuery changes from external sources (e.g. search params)
  useEffect(() => {
    setQuery(initialQuery || '');
  }, [initialQuery]);

  // 1. Debounce query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 2. Fetch suggestions when debounced query updates
  useEffect(() => {
    if (debouncedQuery.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/search/preview?q=${encodeURIComponent(debouncedQuery)}`);
        setSuggestions((response.data || []).slice(0, 5));
        setFocusedIndex(-1);
      } catch (err) {
        console.error('Error fetching search preview suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // 3. Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Keyboard Navigation Controls
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < suggestions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        const selected = suggestions[focusedIndex];
        router.push(selected.target_url);
        setIsOpen(false);
        if (onSearch) onSearch(query.trim());
      } else if (focusedIndex === suggestions.length) {
        setIsOpen(false);
        if (onSearch) {
          onSearch(query.trim());
        } else {
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
      } else {
        setIsOpen(false);
        if (onSearch) {
          onSearch(query.trim());
        } else {
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getIcon = (type) => {
    const iconSize = isCompact ? "w-3.5 h-3.5" : "w-4 h-4";
    switch (type) {
      case 'magazine':
        return <BookOpen className={`${iconSize} text-amber-600 dark:text-amber-400`} />;
      case 'article':
        return <FileText className={`${iconSize} text-blue-600 dark:text-blue-400`} />;
      default:
        return <Globe className={`${iconSize} text-emerald-600 dark:text-emerald-400`} />;
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'magazine':
        return 'bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-500/20';
      case 'article':
        return 'bg-blue-500/5 text-blue-700 dark:text-blue-400 border border-blue-500/20';
      default:
        return 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-left font-sans" onKeyDown={handleKeyDown}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className={isCompact ? "absolute left-3 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" : "absolute left-4 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none"} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim().length >= 3) setIsOpen(true);
            }}
            onClick={() => {
              if (query.trim().length >= 3) setIsOpen(true);
            }}
            placeholder={placeholder}
            className={isCompact
              ? `w-full text-xs font-semibold pl-9 pr-9 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all shadow-sm text-zinc-900 dark:text-zinc-100 ${className}`
              : `w-full text-sm font-semibold pl-12 pr-12 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all shadow-sm text-zinc-900 dark:text-zinc-100 ${className}`
            }
          />
          <div className={isCompact ? "absolute right-3 flex items-center space-x-1" : "absolute right-4 flex items-center space-x-1.5"}>
            {loading && <Loader2 className={isCompact ? "w-3.5 h-3.5 animate-spin text-amber-600" : "w-4 h-4 animate-spin text-amber-600"} />}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Floating suggestion dropdown */}
      {isOpen && (query.trim() !== '') && (suggestions.length > 0 || !loading) && (
        <div className={isCompact
          ? "absolute top-full left-0 w-full mt-1.5 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200/80 dark:border-zinc-850 rounded-2xl shadow-xl shadow-zinc-950/10 backdrop-blur overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
          : "absolute top-full left-0 w-full mt-2 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200/80 dark:border-zinc-850 rounded-2xl shadow-2xl shadow-zinc-950/10 backdrop-blur overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
        }>
          <div className="p-2 space-y-1">
            {suggestions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500 font-medium italic">
                No matching catalog records found.
              </div>
            ) : (
              suggestions.map((item, idx) => {
                const isFocused = focusedIndex === idx;
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => {
                      router.push(item.target_url);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={isCompact
                      ? `w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all text-left cursor-pointer ${
                          isFocused
                            ? 'bg-amber-500/5 text-amber-700 dark:text-amber-400'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                        }`
                      : `w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl transition-all text-left cursor-pointer ${
                          isFocused
                            ? 'bg-amber-500/5 text-amber-700 dark:text-amber-400'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                        }`
                    }
                  >
                    <span className="shrink-0 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900">{getIcon(item.type)}</span>
                    <div className="flex-grow min-w-0">
                      <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-bold block truncate leading-tight`}>
                        {item.title}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider font-mono ${getBadgeStyle(item.type)}`}>
                          {item.type}
                        </span>
                        <span className={`${isCompact ? 'text-[8px]' : 'text-[9px]'} font-medium text-zinc-400 dark:text-zinc-500 truncate`}>
                          {item.additional?.magazine_title || item.additional?.author || 'ScholarlyNest'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* "View all results" bridge */}
          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(query)}`);
                setIsOpen(false);
              }}
              onMouseEnter={() => setFocusedIndex(suggestions.length)}
              className={isCompact
                ? `w-full flex items-center justify-between px-4 py-2.5 border-t border-zinc-150 dark:border-zinc-850 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    focusedIndex === suggestions.length
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'text-zinc-500 hover:text-amber-600 dark:text-zinc-450 dark:hover:text-amber-400'
                  }`
                : `w-full flex items-center justify-between px-6 py-3.5 border-t border-zinc-150 dark:border-zinc-850 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    focusedIndex === suggestions.length
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'text-zinc-500 hover:text-amber-600 dark:text-zinc-450 dark:hover:text-amber-400'
                  }`
              }
            >
              <span>View all results for &ldquo;{query}&rdquo;</span>
              <ArrowRight className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
