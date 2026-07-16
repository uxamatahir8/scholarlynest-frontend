'use client';

import { logError } from '../../../utils/safeLogger';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, BookOpen, FileText, Newspaper, ArrowRight, CornerDownRight } from 'lucide-react';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import PageTitle from '../../../components/PageTitle';

function labelize(value) {
  return String(value || '').replaceAll('_', ' ');
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ articles: [], magazines: [], issues: [] });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.get('/admin/search', { params: { q: query } });
        setResults(res.data || { articles: [], magazines: [], issues: [] });
      } catch (err) {
        logError(err);
        toast('Unable to fetch panel search results.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, toast]);

  const totalResults = results.articles.length + results.magazines.length + results.issues.length;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      <PageTitle title={query ? `Search: ${query}` : 'Search Results'} />
      <header className="border-b border-zinc-200 pb-5 dark:border-zinc-850">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Search Console</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-2.5">
          <Search className="h-6 w-6 text-zinc-400" />
          Search Results
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Showing results for <span className="font-bold text-zinc-850 dark:text-zinc-250">"{query}"</span>
        </p>
      </header>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : totalResults === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Search className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No results found</p>
          <p className="text-xs text-zinc-550 mt-1">Try checking your spelling or searching for a different keyword.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex gap-2 border-b border-zinc-200 pb-px dark:border-zinc-850">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'all'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-250'
              }`}
            >
              All ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'articles'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-250'
              }`}
            >
              Articles ({results.articles.length})
            </button>
            <button
              onClick={() => setActiveTab('magazines')}
              className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'magazines'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-250'
              }`}
            >
              Magazines ({results.magazines.length})
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'issues'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-250'
              }`}
            >
              Issues ({results.issues.length})
            </button>
          </div>

          {/* Results Grid */}
          <div className="space-y-6">
            {/* Articles List */}
            {(activeTab === 'all' || activeTab === 'articles') && results.articles.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 font-mono">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  Manuscript Articles
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {results.articles.map((article) => (
                    <article key={article.id} className="rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 hover:border-amber-500/30 transition-colors">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white">{article.title}</h3>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                            {article.magazine_title || 'No Magazine Assigned'} · By {article.author_name || 'Unknown'}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center rounded-lg border border-amber-500/10 bg-amber-500/[0.04] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-650 dark:text-amber-400 self-start sm:self-auto font-mono">
                          {labelize(article.status)}
                        </span>
                      </div>
                      {article.abstract && (
                        <p className="mt-2 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                          {article.abstract}
                        </p>
                      )}
                      <div className="mt-3.5 flex items-center justify-between border-t border-zinc-50 pt-3 dark:border-zinc-850/60">
                        <span className="text-[10px] text-zinc-400 font-medium">Submitted {new Date(article.created_at).toLocaleDateString()}</span>
                        <Link href={`/admin/articles/${article.id}/workflow`} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600 hover:underline">
                          Open Workflow <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Magazines List */}
            {(activeTab === 'all' || activeTab === 'magazines') && results.magazines.length > 0 && (
              <section className="space-y-3 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 font-mono">
                  <BookOpen className="h-4 w-4 text-zinc-500" />
                  Magazines
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {results.magazines.map((magazine) => (
                    <div key={magazine.id} className="rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 hover:border-amber-500/30 transition-colors">
                      <h3 className="text-sm font-black text-zinc-950 dark:text-white">{magazine.title}</h3>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-605">/{magazine.slug}</p>
                      {magazine.description && (
                        <p className="mt-2 text-xs text-zinc-500 line-clamp-2 leading-relaxed">{magazine.description}</p>
                      )}
                      <div className="mt-4 flex justify-end">
                        <Link href="/admin/magazines" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600 hover:underline">
                          View Magazines Directory <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Issues List */}
            {(activeTab === 'all' || activeTab === 'issues') && results.issues.length > 0 && (
              <section className="space-y-3 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 font-mono">
                  <Newspaper className="h-4 w-4 text-zinc-500" />
                  Magazine Issues
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {results.issues.map((issue) => (
                    <div key={issue.id} className="rounded-xl border border-zinc-150 bg-white p-4 shadow-sm dark:border-zinc-850 dark:bg-zinc-900 hover:border-amber-500/30 transition-colors">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-sm font-black text-zinc-950 dark:text-white">
                            Vol. {issue.volume_number}, Issue {issue.issue_number}
                            {issue.special_title && <span className="font-normal text-zinc-500 ml-1.5">({issue.special_title})</span>}
                          </h3>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                            {issue.magazine_title} · {issue.issue_month} {issue.issue_year}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-650 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 font-mono self-start sm:self-auto">
                          {issue.status}
                        </span>
                      </div>
                      <div className="mt-3.5 flex justify-end">
                        <Link href="/admin/issues" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-600 hover:underline">
                          Open Issue Workspace <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
