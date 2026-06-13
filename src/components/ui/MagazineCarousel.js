'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../utils/api';
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
        console.error('Failed to load latest magazines:', err);
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
      className="relative w-full py-20 overflow-hidden bg-gradient-to-b from-[var(--background)] via-[var(--background)]/80 to-[var(--background)] border-t border-b border-[var(--muted-border)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      id="magazine-carousel-section"
    >
      {/* Visual background ambient glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-80 h-80 bg-[var(--accent-gold)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header and navigation buttons */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 glass-panel rounded-full text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)] border-amber-500/25 dark:border-blue-500/20">
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[var(--accent-gold)]" /> Magazine Catalog</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
              Latest Magazine Issues
            </h2>
            <p className="text-sm text-[var(--muted)] max-w-xl font-medium">
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
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl glass-panel border border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 text-[var(--foreground)] hover:scale-105 transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                id="carousel-next-button"
                aria-label="Next magazine slide"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl glass-panel border border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 text-[var(--foreground)] hover:scale-105 transition-all cursor-pointer shadow-sm"
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
                <div className="h-full hover-glow rounded-2xl transition-all duration-300">
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
