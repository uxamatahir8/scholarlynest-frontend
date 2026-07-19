'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';

export default function ImageLightboxGallery({ images = [], title = 'Images', className = '', showHeader = true, objectFit = 'contain' }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];

  const safeImages = useMemo(() => images.filter((image) => image?.src), [images]);

  useEffect(() => {
    if (activeIndex === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowLeft') setActiveIndex((current) => (current === null ? current : (current + safeImages.length - 1) % safeImages.length));
      if (event.key === 'ArrowRight') setActiveIndex((current) => (current === null ? current : (current + 1) % safeImages.length));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, safeImages.length]);

  if (safeImages.length === 0) return null;

  const open = (index) => setActiveIndex(index);
  const previous = () => setActiveIndex((current) => (current === null ? current : (current + safeImages.length - 1) % safeImages.length));
  const next = () => setActiveIndex((current) => (current === null ? current : (current + 1) % safeImages.length));

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Images className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
            <h4 className="truncate text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{title}</h4>
          </div>
          <span className="shrink-0 text-xs font-bold text-[var(--muted)]">{safeImages.length} image{safeImages.length === 1 ? '' : 's'}</span>
        </div>
      )}
      <div className="grid min-w-0 max-w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {safeImages.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            onClick={() => open(index)}
            className="group relative aspect-[4/3] min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <img src={image.src} alt={image.alt || image.title || 'Article image'} width={image.width || 800} height={image.height || 600} loading="lazy" decoding="async" className={`h-full w-full transition duration-300 group-hover:scale-105 ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`} />
            {(image.title || image.caption || image.label) && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-xs font-bold text-white">
                <span className="block truncate">{image.label ? `${image.label}: ` : ''}{image.title || image.caption}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {activeImage && (
        <div className="fixed inset-0 z-[1000] bg-black/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={activeImage.title || title}>
          <button type="button" onClick={() => setActiveIndex(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20" aria-label="Close gallery">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={previous} className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:block" aria-label="Previous image">
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button type="button" onClick={next} className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:block" aria-label="Next image">
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <img src={activeImage.src} alt={activeImage.alt || activeImage.title || 'Article image'} className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl" />
            {(activeImage.title || activeImage.caption || activeImage.description) && (
              <div className="max-w-3xl rounded-xl bg-white/10 px-4 py-3 text-center text-white">
                {activeImage.title && <p className="text-sm font-bold">{activeImage.title}</p>}
                {activeImage.caption && <p className="mt-1 text-sm text-white/80">{activeImage.caption}</p>}
                {activeImage.description && <p className="mt-1 text-xs text-white/65">{activeImage.description}</p>}
              </div>
            )}
            <div className="flex max-w-full gap-2 overflow-x-auto px-2">
              {safeImages.map((image, index) => (
                <button
                  key={`thumb-${image.src}-${index}`}
                  type="button"
                  onClick={() => open(index)}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border ${index === activeIndex ? 'border-amber-400' : 'border-white/20 opacity-70'} transition hover:opacity-100`}
                  aria-label={`Open image ${index + 1}`}
                >
                  <img src={image.src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
