'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50/20 dark:bg-zinc-950/10 px-6 relative overflow-hidden font-sans">
      <SeoHead
        title="Page Not Found — ScholarlyNest"
        description="The requested page could not be located in the ScholarlyNest catalog."
        ogUrl="/404"
      />

      {/* Ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Glowing Central Graphic */}
        <div className="flex justify-center">
          <div className="relative p-6 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm hover-glow group transition-premium">
            <FileQuestion className="w-16 h-16 text-amber-600 transition-transform duration-500 group-hover:rotate-12" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-550 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" />
          </div>
        </div>

        {/* Academic branding copy */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 font-mono">
            Error Code: 404 INDEX_MISSING
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-white leading-tight">
            Citation Archive Missing
          </h1>
          <p className="text-xs sm:text-sm text-zinc-505 dark:text-zinc-400 leading-relaxed max-w-md mx-auto font-medium">
            The scholarly citation, research record, or dynamic guidelines page you are trying to query could not be resolved inside our catalog indexes.
          </p>
        </div>

        {/* Divider bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent w-2/3 mx-auto" />

        {/* Clear premium action button groups */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-955 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors shadow-md cursor-pointer"
          >
            <Home className="w-4 h-4 text-amber-500" />
            <span>Return to Homepage</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
