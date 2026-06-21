'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import { logError } from '../../utils/safeLogger';
import MagazineCard from '../magazine/MagazineCard';

export default function MagazineCarousel() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleSlides, setVisibleSlides] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch the latest 10 magazines from the backend
  useEffect(() => {
    const fetchLatestMagazines = async () => {
      try {
        setLoading(true);
        const response = await api.get('/magazines/latest');
        if (response.data && response.data.status === 'success') {
          setMagazines(response.data.data || []);
        } else {
          setMagazines(response.data || []);
        }
      } catch (err) {
        logError('Failed to load latest magazines:', err);
        setError('We were unable to load the latest magazine publications at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestMagazines();
  }, []);

  // Update visible slides count dynamically based on window width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setVisibleSlides(4);
      } else if (window.innerWidth >= 1024) {
        setVisibleSlides(3);
      } else if (window.innerWidth >= 640) {
        setVisibleSlides(2);
      } else {
        setVisibleSlides(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate maximum index we can slide to
  const maxIndex = Math.max(0, magazines.length - visibleSlides);

  // Keep currentIndex bounded if visibleSlides or magazines change
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Autoplay functionality
  useEffect(() => {
    if (isPaused || magazines.length <= visibleSlides) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, handleNext, magazines.length, visibleSlides]);

  // Touch handlers for mobile swipe guestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // swipe sensitivity threshold in px

    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
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
          Loading issues catalogue...
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

  if (magazines.length === 0) {
    return null; // hide section if there are no magazines
  }

  return (
    <section 
      className="relative w-full py-16 lg:py-20 overflow-hidden bg-[var(--surface)] border-t border-b border-[var(--border)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      id="magazine-carousel-section"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header and navigation buttons */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[var(--accent-gold)]" /> Magazine Catalog</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Latest Magazine Issues
            </h2>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-350 max-w-xl">
              Browse our newly published magazine issues and curated digital periodicals.
            </p>
          </div>

          {/* Nav buttons (Only show if we can actually slide) */}
          {maxIndex > 0 && (
            <div className="flex items-center space-x-3 self-start md:self-end">
              <button
                onClick={handlePrev}
                id="carousel-prev-button"
                aria-label="Previous magazine slide"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] shadow-sm transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                id="carousel-next-button"
                aria-label="Next magazine slide"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] shadow-sm transition-colors hover:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Container */}
        <div 
          className="relative w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Carousel Slider Track */}
          <div 
            className={`flex will-change-transform ${magazines.length < visibleSlides ? 'justify-center' : ''}`}
            style={{
              transform: `translate3d(-${currentIndex * (100 / magazines.length)}%, 0, 0)`,
              width: magazines.length <= visibleSlides ? '100%' : `${(magazines.length / visibleSlides) * 100}%`,
              transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {magazines.map((magazine) => (
              <div 
                key={magazine.id}
                className="flex-shrink-0 px-3"
                style={{ 
                  width: magazines.length <= visibleSlides 
                    ? `${100 / visibleSlides}%` 
                    : `${100 / magazines.length}%` 
                }}
              >
                <div className="h-full rounded-lg transition-colors">
                  <MagazineCard 
                    id={magazine.id}
                    title={magazine.title}
                    slug={magazine.slug}
                    cover_image={magazine.cover_image}
                    description={magazine.description}
                    articles_count={magazine.articles_count}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots (Only show if multiple pages available) */}
        {maxIndex > 0 && (
          <div className="flex justify-center items-center space-x-2.5 mt-10">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                id={`carousel-dot-${idx}`}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx 
                    ? 'w-6 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-gold)] shadow-sm' 
                    : 'w-2 bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
