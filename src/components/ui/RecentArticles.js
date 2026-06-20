'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../utils/api';
import { logError } from '../../utils/safeLogger';

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

const chunkArticles = (articles, size) => {
  const chunks = [];
  for (let index = 0; index < articles.length; index += size) {
    chunks.push(articles.slice(index, index + size));
  }
  return chunks;
};

export default function RecentArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [articlesPerSlide, setArticlesPerSlide] = useState(4);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const fetchRecentArticles = async () => {
      try {
        setLoading(true);
        const response = await api.get('/articles/latest', {
          params: { limit: 10 }
        });
        if (response.data && response.data.status === 'success') {
          setArticles(response.data.data || []);
        } else {
          setArticles(response.data || []);
        }
      } catch (err) {
        logError('Failed to load recent articles:', err);
        setError('We were unable to load the recently published research articles at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentArticles();
  }, []);

  useEffect(() => {
    const updateArticlesPerSlide = () => {
      if (window.innerWidth >= 1024) {
        setArticlesPerSlide(4);
      } else if (window.innerWidth >= 640) {
        setArticlesPerSlide(2);
      } else {
        setArticlesPerSlide(1);
      }
    };

    updateArticlesPerSlide();
    window.addEventListener('resize', updateArticlesPerSlide);
    return () => window.removeEventListener('resize', updateArticlesPerSlide);
  }, []);

  const slides = useMemo(
    () => chunkArticles(articles, articlesPerSlide),
    [articles, articlesPerSlide]
  );
  const totalSlides = slides.length;
  const canSlide = totalSlides > 1;
  const canGoPrev = currentSlide > 0;
  const canGoNext = currentSlide < totalSlides - 1;

  useEffect(() => {
    setCurrentSlide((slide) => Math.min(slide, Math.max(totalSlides - 1, 0)));
  }, [totalSlides]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const stripHtml = (htmlString) => {
    if (!htmlString) return '';
    return htmlString
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  };

  const getAuthorNames = (article) => {
    const articleAuthors = Array.isArray(article.article_authors) ? article.article_authors : [];
    const names = articleAuthors
      .slice()
      .sort((a, b) => (a.author_order || 0) - (b.author_order || 0))
      .map((author) => author.co_author_name)
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(', ');
    }

    return article.user?.name || 'ScholarlyNest Author';
  };

  const getIssueLabel = (article) => {
    if (!article.issue) return '';

    const parts = [];
    if (article.issue.volume_number) {
      parts.push(`Vol. ${article.issue.volume_number}`);
    }
    if (article.issue.issue_number) {
      parts.push(`Issue ${article.issue.issue_number}`);
    }
    if (article.issue.issue_month || article.issue.issue_year) {
      parts.push([article.issue.issue_month, article.issue.issue_year].filter(Boolean).join(' '));
    }

    return parts.join(' | ');
  };

  const goToSlide = useCallback((slideIndex) => {
    setCurrentSlide(Math.min(Math.max(slideIndex, 0), Math.max(totalSlides - 1, 0)));
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    if (canGoPrev) {
      goToSlide(currentSlide - 1);
    }
  }, [canGoPrev, currentSlide, goToSlide]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      goToSlide(currentSlide + 1);
    }
  }, [canGoNext, currentSlide, goToSlide]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchMove = (event) => {
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
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
    return null;
  }

  return (
    <section className="py-24 bg-gradient-to-b from-[var(--background)] via-[var(--background)]/95 to-[var(--background)] border-t border-[var(--muted-border)] relative overflow-hidden" id="recent-articles-section">
      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 glass-panel rounded-full text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)] border-amber-500/25 dark:border-blue-500/20">
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[var(--accent-gold)]" /> Latest Submissions</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              Latest Published Articles
            </h2>

            <p className="text-sm text-[var(--muted)] max-w-2xl font-medium">
              Explore individual academic papers, scientific drafts, and telemetry analyses newly approved and peer-reviewed across our magazine issues.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-end">
            {canSlide && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                  aria-label="Previous published articles slide"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl glass-panel border border-[var(--muted-border)] text-[var(--foreground)] transition-all shadow-sm hover:bg-[var(--foreground)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  aria-label="Next published articles slide"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl glass-panel border border-[var(--muted-border)] text-[var(--foreground)] transition-all shadow-sm hover:bg-[var(--foreground)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            <Link
              href="/magazines"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 dark:bg-blue-600 dark:hover:bg-blue-600/90 text-white text-[11px] font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
            >
              <BookOpenText className="w-4 h-4 mr-2" />
              <span>Explore Catalog</span>
            </Link>
          </div>
        </div>

        <div
          className="relative w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-roledescription="carousel"
          aria-label="Latest published articles"
        >
          <div
            className="flex will-change-transform"
            style={{
              transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
              transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {slides.map((slide, slideIndex) => (
              <div
                key={`article-slide-${slideIndex}`}
                className="w-full shrink-0"
              >
                <div
                  className="grid gap-5 sm:gap-6"
                  style={{ gridTemplateColumns: `repeat(${articlesPerSlide}, minmax(0, 1fr))` }}
                >
                  {slide.map((article) => {
                    const artSlug = article.slug || '';
                    const articleLink = `/articles/${artSlug}`;
                    const imageSrc = getFullImageUrl(article.featured_image || article.magazine?.cover_image);
                    const excerpt = stripHtml(article.abstract) || 'No abstract summary provided for this research article.';
                    const issueLabel = getIssueLabel(article);
                    const publishedDate = formatDate(article.published_at || article.created_at);

                    return (
                      <article
                        key={article.id}
                        className="glass-panel rounded-2xl p-5 transition-all duration-300 border border-[var(--muted-border)] hover:border-[var(--accent)]/20 hover:bg-[var(--card-bg)] hover-glow min-w-0 h-full flex flex-col"
                      >
                        {imageSrc && (
                          <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 relative mb-5">
                            <img
                              src={imageSrc}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="flex flex-col flex-1 min-w-0 text-left">
                          {article.magazine && (
                            <Link
                              href={`/magazines/${article.magazine.slug}`}
                              className="inline-block w-fit text-[9px] font-bold text-[var(--accent-gold)] uppercase tracking-widest hover:underline hover:text-[var(--accent)] transition-colors mb-3"
                            >
                              {article.magazine.title}
                            </Link>
                          )}

                          <Link href={articleLink} className="block group mb-3">
                            <h3 className="font-serif text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-3">
                              {article.title}
                            </h3>
                          </Link>

                          <div className="space-y-2 text-[10px] font-mono text-[var(--muted)]/85 font-bold uppercase mb-4">
                            <p className="line-clamp-2">By {getAuthorNames(article)}</p>
                            {publishedDate && <p>{publishedDate}</p>}
                            {issueLabel && <p>{issueLabel}</p>}
                            {article.doi && (
                              <p className="break-all normal-case">
                                DOI: <a className="text-[var(--accent)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded-sm" href={`https://doi.org/${article.doi.replace(/^https?:\/\/doi\.org\//, '')}`} target="_blank" rel="noreferrer">{article.doi}</a>
                              </p>
                            )}
                          </div>

                          <p className="text-xs text-[var(--muted)] line-clamp-4 font-medium leading-relaxed mb-5">
                            {excerpt}
                          </p>

                          <Link
                            href={articleLink}
                            className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 dark:bg-blue-600 dark:hover:bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
                          >
                            <span>Read Article</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {canSlide && (
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2.5">
              {slides.map((_, index) => (
                <button
                  key={`article-dot-${index}`}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to published articles slide ${index + 1}`}
                  aria-current={currentSlide === index ? 'true' : undefined}
                  className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] ${
                    currentSlide === index
                      ? 'w-6 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-gold)] shadow-sm'
                      : 'w-2 bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] font-mono" aria-live="polite">
              Slide {currentSlide + 1} of {totalSlides}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
