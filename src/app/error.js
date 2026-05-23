'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log exception details for system administrators
    console.error('Captured exception:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[var(--background)] px-6 relative overflow-hidden font-sans">
      {/* Hoist the page tab title */}
      <title>Telemetry Fault  - ScholarlyNest</title>

      {/* Ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-gold)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Glowing Central Graphic */}
        <div className="flex justify-center">
          <div className="relative p-6 bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-3xl shadow-[0_15px_35px_rgba(239,68,68,0.05)] hover-glow group transition-premium">
            <AlertOctagon className="w-16 h-16 text-red-500 transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* Academic branding copy */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-red-500 font-mono">
            Error Code: 500 TELEMETRY_FAULT
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)] leading-tight">
            Telemetry Interface Error
          </h1>
          <p className="text-sm font-semibold text-[var(--muted)] leading-relaxed max-w-md mx-auto">
            The platform runtime encountered an unexpected exception while compiling or rendering your active workspace.
          </p>
        </div>

        {/* Diagnostics Code Box */}
        <div className="bg-red-500/5 dark:bg-black/30 backdrop-blur-md border border-red-500/10 dark:border-red-500/20 rounded-2xl p-4 text-left max-w-md mx-auto">
          <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block mb-2 font-mono">System Exception Report:</span>
          <code className="text-[11px] font-mono text-zinc-100 dark:text-zinc-200 block break-words leading-relaxed">
            {error?.message || 'Unexpected application boundary crash occurred.'}
          </code>
        </div>

        {/* Divider bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-800 to-transparent w-2/3 mx-auto" />

        {/* Clear premium action button groups */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent)]/95 shadow-[0_0_15px_rgba(44,67,102,0.3)] transition-premium hover-glow cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>Retry Workspace Initialization</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--foreground)] bg-white/10 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 hover:bg-black/5 dark:hover:bg-white/5 transition-premium cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Scholarly Feed</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
