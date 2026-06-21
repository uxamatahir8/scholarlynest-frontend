'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { logError } from '../utils/safeLogger';
import './globals.css';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    logError('Captured critical global error:', error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <head>
        <title>Root System Error - ScholarlyNest</title>
      </head>
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex items-center justify-center px-6 relative overflow-hidden font-sans">
        
        {/* Ambient glowing circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-xl w-full text-center relative z-10 space-y-8">
          
          {/* Glowing Central Graphic */}
          <div className="flex justify-center">
            <div className="relative p-6 bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-3xl shadow-[0_15px_35px_rgba(239,68,68,0.1)]">
              <AlertOctagon className="w-16 h-16 text-red-550 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          </div>

          {/* Academic branding copy */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 font-mono">
              Error Code: 500 CRITICAL_KERNEL_FAULT
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight">
              Root Kernel Failure
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto font-medium">
              The root layout layout tree of ScholarlyNest failed to compile or resolve workspace dependencies correctly.
            </p>
          </div>

          {/* Safe diagnostics messaging */}
          <div className="bg-red-500/5 dark:bg-black/40 backdrop-blur-md border border-red-500/10 rounded-2xl p-5 text-left max-w-md mx-auto">
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block mb-1.5 font-mono">Kernel Diagnostic Report:</span>
            <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
              Root page layout tree crashed during initial shell assembly. Safe mode activated. Details logged for administrator attention.
            </p>
          </div>

          {/* Divider bar */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-2/3 mx-auto" />

          {/* Recovery triggers */}
          <div className="flex justify-center">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-950 bg-white hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Restore Core Root Shell</span>
            </button>
          </div>

        </div>
      </body>
    </html>
  );
}
