'use client';

import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1, label = 'Pagination' }) {
  if (totalPages <= 1) return null;

  const getPageRange = () => {
    const totalNumbers = siblingCount * 2 + 5;
    if (totalPages <= totalNumbers) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      return [...Array.from({ length: leftItemCount }, (_, i) => i + 1), 'DOTS', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      return [1, 'DOTS', ...Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1)];
    }

    return [1, 'DOTS', ...Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i), 'DOTS', totalPages];
  };

  const pages = getPageRange() || [];
  const buttonBase = 'inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-45';

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label={label}>
      <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(1)} className={`${buttonBase} border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]`} aria-label="Go to first page">First</button>
      <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className={`${buttonBase} border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]`} aria-label="Go to previous page">Prev</button>
      {pages.map((page, index) => page === 'DOTS' ? (
        <span key={`dots-${index}`} className="px-1 text-[var(--muted)]" aria-hidden="true">...</span>
      ) : (
        <button key={page} type="button" onClick={() => onPageChange(page)} aria-label={`Go to page ${page}`} aria-current={page === currentPage ? 'page' : undefined} className={`${buttonBase} ${page === currentPage ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]'}`}>{page}</button>
      ))}
      <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className={`${buttonBase} border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]`} aria-label="Go to next page">Next</button>
      <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)} className={`${buttonBase} border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]`} aria-label="Go to last page">Last</button>
    </nav>
  );
}
