'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const chunkArticles = (articles, size) => {
  const chunks = [];
  for (let index = 0; index < articles.length; index += size) {
    chunks.push(articles.slice(index, index + size));
  }
  return chunks;
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

  if (names.length > 0) return names.join(', ');
  return article.user?.name || 'ScholarlyNest Author';
};

const getIssueLabel = (article) => {
  if (!article.issue) return '';
  const parts = [];
  if (article.issue.volume_number) parts.push(`Vol. ${article.issue.volume_number}`);
  if (article.issue.issue_number) parts.push(`Issue ${article.issue.issue_number}`);
  if (article.issue.issue_month || article.issue.issue_year) {
    parts.push([article.issue.issue_month, article.issue.issue_year].filter(Boolean).join(' '));
  }
  return parts.join(' | ');
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function MagazineArticleCarousel({ articles = [], coverImage = '', getImageUrl, onArticleClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [articlesPerSlide, setArticlesPerSlide] = useState(4);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const updateArticlesPerSlide = () => {
      if (window.innerWidth >= 1024) setArticlesPerSlide(4);
      else if (window.innerWidth >= 640) setArticlesPerSlide(2);
      else setArticlesPerSlide(1);
    };

    updateArticlesPerSlide();
    window.addEventListener('resize', updateArticlesPerSlide);
    return () => window.removeEventListener('resize', updateArticlesPerSlide);
  }, []);

  const slides = useMemo(() => chunkArticles(articles, articlesPerSlide), [articles, articlesPerSlide]);
  const totalSlides = slides.length;
  const canSlide = totalSlides > 1;
  const canGoPrev = currentSlide > 0;
  const canGoNext = currentSlide < totalSlides - 1;

  useEffect(() => {
    setCurrentSlide((slide) => Math.min(slide, Math.max(totalSlides - 1, 0)));
  }, [totalSlides]);

  const goToSlide = useCallback((slideIndex) => {
    setCurrentSlide(Math.min(Math.max(slideIndex, 0), Math.max(totalSlides - 1, 0)));
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    if (canGoPrev) goToSlide(currentSlide - 1);
  }, [canGoPrev, currentSlide, goToSlide]);

  const handleNext = useCallback(() => {
    if (canGoNext) goToSlide(currentSlide + 1);
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
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-850 bg-white/80 dark:bg-zinc-900/30 p-6 text-sm text-zinc-500 dark:text-zinc-400">
        No published articles are available for this magazine yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {canSlide && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous magazine articles slide"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-50 dark:focus:ring-offset-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next magazine articles slide"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-50 dark:focus:ring-offset-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div
        className="relative w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-roledescription="carousel"
        aria-label="Latest articles in this magazine"
      >
        <div
          className="flex will-change-transform"
          style={{
            transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
            transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {slides.map((slide, slideIndex) => (
            <div key={`magazine-article-slide-${slideIndex}`} className="w-full shrink-0">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${articlesPerSlide}, minmax(0, 1fr))` }}>
                {slide.map((article) => {
                  const articleLink = `/articles/${article.slug || ''}`;
                  const imageSrc = getImageUrl ? getImageUrl(article.featured_image || coverImage) : article.featured_image || coverImage;
                  const issueLabel = getIssueLabel(article);
                  const publishedDate = formatDate(article.published_at || article.created_at);
                  const excerpt = stripHtml(article.abstract) || 'No abstract summary provided for this research article.';

                  return (
                    <article key={article.id} className="min-w-0 h-full flex flex-col rounded-xl border border-zinc-200/70 dark:border-zinc-850 bg-white/80 dark:bg-zinc-900/30 p-4 shadow-sm transition-colors hover:border-amber-500/30">
                      {imageSrc && (
                        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 mb-4">
                          <img src={imageSrc} alt="" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                        </div>
                      )}

                      <div className="flex flex-col flex-1 min-w-0">
                        <Link href={articleLink} onClick={() => onArticleClick?.(article.id)} className="group mb-3">
                          <h4 className="font-serif text-base font-bold text-zinc-900 dark:text-white leading-snug line-clamp-3 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                            {article.title}
                          </h4>
                        </Link>

                        <div className="space-y-2 text-[9px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-500 mb-4">
                          <p className="line-clamp-2">By {getAuthorNames(article)}</p>
                          {publishedDate && <p>{publishedDate}</p>}
                          {issueLabel && <p>{issueLabel}</p>}
                          {article.doi && (
                            <p className="normal-case break-all">
                              DOI: <a className="text-amber-700 dark:text-amber-400 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-sm" href={`https://doi.org/${article.doi.replace(/^https?:\/\/doi\.org\//, '')}`} target="_blank" rel="noreferrer">{article.doi}</a>
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-4 leading-relaxed mb-5">{excerpt}</p>

                        <Link
                          href={articleLink}
                          onClick={() => onArticleClick?.(article.id)}
                          className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950"
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
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={`magazine-article-dot-${index}`}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Go to magazine articles slide ${index + 1}`}
                aria-current={currentSlide === index ? 'true' : undefined}
                className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-50 dark:focus:ring-offset-zinc-950 ${
                  currentSlide === index ? 'w-6 bg-amber-600' : 'w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 font-mono" aria-live="polite">
            Slide {currentSlide + 1} of {totalSlides}
          </p>
        </div>
      )}
    </div>
  );
}
