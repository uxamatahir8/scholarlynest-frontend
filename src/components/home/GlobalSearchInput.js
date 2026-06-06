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
        setSuggestions(response.data || []);
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
        return <BookOpen className={`${iconSize} text-[var(--accent-gold)]`} />;
      case 'article':
        return <FileText className={`${iconSize} text-blue-400`} />;
      default:
        return <Globe className={`${iconSize} text-emerald-400`} />;
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
    <div ref={containerRef} className="relative w-full text-left" onKeyDown={handleKeyDown}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className={isCompact ? "absolute left-3 w-4 h-4 text-[var(--muted)] pointer-events-none" : "absolute left-4 w-5 h-5 text-[var(--muted)] pointer-events-none"} />
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
              ? `w-full text-xs font-semibold pl-9 pr-9 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--accent)] dark:focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-sm text-zinc-900 dark:text-zinc-100 ${className}`
              : `w-full text-sm font-semibold pl-12 pr-12 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-[var(--accent)] dark:focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-md text-zinc-900 dark:text-zinc-100 ${className}`
            }
          />
          <div className={isCompact ? "absolute right-3 flex items-center space-x-1" : "absolute right-4 flex items-center space-x-1.5"}>
            {loading && <Loader2 className={isCompact ? "w-3.5 h-3.5 animate-spin text-[var(--accent)]" : "w-4 h-4 animate-spin text-[var(--accent)]"} />}
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
          ? "absolute top-full left-0 w-full mt-1.5 bg-white dark:bg-[#121211] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
          : "absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#121211] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
        }>
          <div className="p-2 space-y-1">
            {suggestions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-[var(--muted)] font-medium italic">
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
                      ? `w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
                          isFocused
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`
                      : `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-left cursor-pointer ${
                          isFocused
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`
                    }
                  >
                    <span className="shrink-0">{getIcon(item.type)}</span>
                    <div className="flex-grow min-w-0">
                      <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-bold block truncate leading-tight`}>
                        {item.title}
                      </span>
                      <span className={`${isCompact ? 'text-[8px]' : 'text-[9px]'} uppercase font-bold tracking-wider font-mono text-[var(--muted)] block mt-0.5`}>
                        {item.type} • {item.additional?.magazine_title || item.additional?.author || 'ScholarlyNest'}
                      </span>
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
                ? `w-full flex items-center justify-between px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    focusedIndex === suggestions.length
                      ? 'bg-zinc-50 dark:bg-zinc-900 text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:text-zinc-900 dark:hover:text-white bg-black/5 dark:bg-white/5'
                  }`
                : `w-full flex items-center justify-between px-6 py-3 border-t border-zinc-200 dark:border-zinc-850 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    focusedIndex === suggestions.length
                      ? 'bg-zinc-50 dark:bg-zinc-900 text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:text-zinc-900 dark:hover:text-white bg-black/5 dark:bg-white/5'
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
