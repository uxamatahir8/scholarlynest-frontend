'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md transition-all duration-300">
      
      {/* Dynamic Academic Double Concentric Spinner */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Outer Circle */}
        <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white animate-spin duration-1000" />
        
        {/* Inner Circle (reverses direction) */}
        <div className="absolute w-8 h-8 rounded-full border-4 border-zinc-250 dark:border-zinc-750 border-b-zinc-500 dark:border-b-zinc-400 animate-spin duration-700 [animation-direction:reverse]" />
      </div>

      {/* Elegant Branding Subtitle */}
      <div className="mt-6 flex flex-col items-center space-y-1 select-none">
        <span className="font-serif text-sm font-bold tracking-widest text-zinc-900 dark:text-white uppercase">
          ScholarlyNest
        </span>
        <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest animate-pulse">
          Loading Data Nodes...
        </span>
      </div>

    </div>
  );
}
