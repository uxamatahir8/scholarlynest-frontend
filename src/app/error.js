'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { logError } from '../utils/safeLogger';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log exception details for system administrators
    logError('Captured exception:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50/20 dark:bg-zinc-950/10 px-6 relative overflow-hidden font-sans">
      <title>Application Error - ScholarlyNest</title>

      {/* Ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Glowing Central Graphic */}
        <div className="flex justify-center">
          <div className="relative p-6 bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-3xl shadow-[0_15px_35px_rgba(239,68,68,0.05)] hover-glow group transition-premium">
            <AlertOctagon className="w-16 h-16 text-red-550 transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* Academic branding copy */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-650 dark:text-red-400 font-mono">
            Error Code: 500 SYSTEM_FAULT
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-white leading-tight">
            Unexpected System Error
          </h1>
          <p className="text-xs sm:text-sm text-zinc-505 dark:text-zinc-400 leading-relaxed max-w-md mx-auto font-medium">
            The platform runtime encountered an unexpected boundary crash while loading your active workspace.
          </p>
        </div>

        {/* Safe, non-technical diagnostics box */}
        <div className="bg-zinc-100/80 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 text-left max-w-md mx-auto">
          <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono">
            System Message:
          </span>
          <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-semibold">
            An unexpected error occurred during database synthesis or workspace compilation. The technical logs have been dispatched to platform diagnostics.
          </p>
        </div>

        {/* Divider bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent w-2/3 mx-auto" />

        {/* Clear premium action button groups */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow text-amber-505 dark:text-amber-600" />
            <span>Retry Workspace Initialization</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-150 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
