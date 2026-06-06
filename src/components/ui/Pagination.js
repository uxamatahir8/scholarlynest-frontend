'use client';

import React from 'react';

/**
 * Reusable Premium Pagination Component
 * 
 * @param {number} currentPage - The current active page (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when a page is selected
 * @param {number} siblingCount - Number of page buttons to show around the current page
 */
export default function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1 }) {
  if (totalPages <= 1) return null;

  // Calculate range of page numbers to show
  const getPageRange = () => {
    const totalNumbers = siblingCount * 2 + 5; // first, last, current, siblings, and 2 ellipsis
    
    // Case 1: totalPages is less than total numbers we want to show
    if (totalPages <= totalNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Case 2: No left dots, but right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, 'DOTS', totalPages];
    }

    // Case 3: Left dots, but no right dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
      return [1, 'DOTS', ...rightRange];
    }

    // Case 4: Both left and right dots
    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
      return [1, 'DOTS', ...middleRange, 'DOTS', totalPages];
    }
  };

  const pages = getPageRange() || [];

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs font-semibold select-none">
      {/* Previous Button */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121211] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-900/60 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-[#121211] transition-all cursor-pointer disabled:cursor-not-allowed text-[10px] uppercase font-bold tracking-wider"
      >
        Prev
      </button>

      {/* Page Numbers */}
      {pages.map((page, index) => {
        if (page === 'DOTS') {
          return (
            <span
              key={`dots-${index}`}
              className="px-1.5 py-1 text-zinc-400 dark:text-zinc-650 font-bold"
            >
              &bull;&bull;&bull;
            </span>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`h-8 min-w-[32px] px-1.5 rounded-xl flex items-center justify-center border transition-all cursor-pointer text-[10px] font-bold ${
              isCurrent
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121211] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121211] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-900/60 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-[#121211] transition-all cursor-pointer disabled:cursor-not-allowed text-[10px] uppercase font-bold tracking-wider"
      >
        Next
      </button>
    </div>
  );
}
