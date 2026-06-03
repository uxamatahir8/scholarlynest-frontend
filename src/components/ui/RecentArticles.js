'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowRight, Eye, Sparkles, BookOpenText } from 'lucide-react';
import api from '../../utils/api';

export default function RecentArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentArticles = async () => {
      try {
        setLoading(true);
        const response = await api.get('/articles/latest', {
          params: { limit: 5 }
        });
        if (response.data && response.data.status === 'success') {
          setArticles(response.data.data || []);
        } else {
          setArticles(response.data || []);
        }
      } catch (err) {
        console.error('Failed to load recent articles:', err);
        setError('We were unable to load the recently published research articles at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentArticles();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to strip HTML tags and decode common HTML entities for previews
  const stripHtml = (htmlString) => {
    if (!htmlString) return '';
    return htmlString
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest font-mono">
          Loading published manuscripts...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-red-700 dark:text-red-400 text-xs">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="font-semibold">{error}</span>
      </div>
    );
  }

  if (articles.length === 0) {
    return null; // hide section if no articles exist
  }

  return (
    <section className="py-24 bg-gradient-to-b from-[var(--background)] via-[var(--background)]/95 to-[var(--background)] border-t border-[var(--muted-border)] relative overflow-hidden" id="recent-articles-section">
      {/* Background ambient glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-[var(--accent)]/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-[var(--accent-gold)]/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Full-width Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 glass-panel rounded-full text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)] border-amber-500/25 dark:border-blue-500/20">
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[var(--accent-gold)]" /> Latest Submissions</span>
            </div>
            
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              Recently Published Articles
            </h2>
            
            <p className="text-sm text-[var(--muted)] max-w-2xl font-medium">
              Explore individual academic papers, scientific drafts, and telemetry analyses newly approved and peer-reviewed across our magazine issues.
            </p>
          </div>
          
          <div className="self-start md:self-end">
            <Link 
              href="/magazines" 
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 dark:bg-blue-600 dark:hover:bg-blue-600/90 text-white text-[11px] font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-blue-500/10"
            >
              <BookOpenText className="w-4 h-4 mr-2" />
              <span>Explore Catalog</span>
            </Link>
          </div>
        </div>

        {/* Full-width Cards Container */}
        <div className="space-y-6">
          {articles.map((article) => {
            const magSlug = article.magazine?.slug || '';
            const artSlug = article.slug || '';
            const articleLink = `/magazines/${magSlug}/articles/${artSlug}`;
            
            return (
              <article 
                key={article.id}
                className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:scale-[1.005] border border-[var(--muted-border)] hover:border-[var(--accent)]/20 hover:bg-[var(--card-bg)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 hover-glow w-full"
              >
                <div className="flex-grow space-y-2 text-left w-full sm:max-w-[80%]">
                  {/* Magazine Badge */}
                  {article.magazine && (
                    <Link 
                      href={`/magazines/${article.magazine.slug}`}
                      className="inline-block text-[9px] font-bold text-[var(--accent-gold)] uppercase tracking-widest hover:underline hover:text-[var(--accent)] transition-colors"
                    >
                      {article.magazine.title}
                    </Link>
                  )}

                  {/* Article Title */}
                  <Link href={articleLink} className="block group">
                    <h3 className="font-serif text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {article.title}
                    </h3>
                  </Link>

                  {/* Clean Abstract Preview (HTML elements stripped) */}
                  <p className="text-xs text-[var(--muted)] line-clamp-2 font-medium leading-relaxed">
                    {stripHtml(article.abstract) || 'No abstract summary provided for this research article.'}
                  </p>

                  {/* Metadata Footer */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[9px] font-mono text-[var(--muted)]/80 font-bold uppercase">
                    <span>By {article.user?.name || 'ScholarlyNest Author'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]/30" />
                    <span>{formatDate(article.created_at)}</span>
                    
                    {/* Telemetry Engagement Metrics */}
                    {(article.impressions > 0 || article.clicks > 0) && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]/30" />
                        <span className="flex items-center gap-1.5 text-[var(--accent-gold)] font-mono">
                          <Eye className="w-3.5 h-3.5" />
                          {article.impressions || 0} views
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Read Link Button */}
                <div className="flex sm:flex-col items-end shrink-0 self-start sm:self-center">
                  <Link 
                    href={articleLink}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] dark:text-blue-400 hover:text-[var(--accent-gold)] transition-colors group cursor-pointer"
                  >
                    <span>Read Paper</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
