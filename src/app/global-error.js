'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import './globals.css';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Captured critical global error:', error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <head>
        <title>Critical Kernel Failure  - ScholarlyNest</title>
      </head>
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex items-center justify-center px-6 relative overflow-hidden font-sans">
        
        {/* Ambient glowing circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-xl w-full text-center relative z-10 space-y-8">
          
          {/* Glowing Central Graphic */}
          <div className="flex justify-center">
            <div className="relative p-6 bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-3xl shadow-[0_15px_35px_rgba(239,68,68,0.1)]">
              <AlertOctagon className="w-16 h-16 text-red-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          </div>

          {/* Academic branding copy */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400 font-mono">
              Error Code: 500 CRITICAL_KERNEL_FAULT
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Root Kernel Failure
            </h1>
            <p className="text-sm font-semibold text-zinc-400 leading-relaxed max-w-md mx-auto">
              The root layout layout tree of ScholarlyNest crashed or failed to initialize its workspace dependencies.
            </p>
          </div>

          {/* Diagnostics Code Box */}
          <div className="bg-red-500/5 dark:bg-black/40 backdrop-blur-md border border-red-500/10 rounded-2xl p-4 text-left max-w-md mx-auto">
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block mb-2 font-mono">Kernel Diagnostic Report:</span>
            <code className="text-[11px] font-mono text-zinc-200 block break-words leading-relaxed">
              {error?.message || 'Critical root shell rendering error.'}
            </code>
          </div>

          {/* Divider bar */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-2/3 mx-auto" />

          {/* Clear premium recovery triggers */}
          <div className="flex justify-center">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restore Core Root Shell</span>
            </button>
          </div>

        </div>
      </body>
    </html>
  );
}
