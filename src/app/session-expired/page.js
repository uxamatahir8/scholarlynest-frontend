'use client';

import React from 'react';
import { LogIn, Home, Clock } from 'lucide-react';
import Link from 'next/link';
import SeoHead from '../../components/SeoHead';

export default function SessionExpired() {
  return (
    <div className="flex-grow flex flex-col justify-center items-center py-20 px-4">
      <SeoHead
        title="Session Expired"
        ogTitle="Session Expired — ScholarlyNest"
        description="Your academic session has expired. Please log in again."
        ogUrl="/session-expired"
      />
      <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md space-y-6 text-center max-w-md w-full">
        <div className="mx-auto w-12 h-12 rounded-full bg-danger/10 border border-danger/25 flex items-center justify-center text-danger">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-black text-foreground leading-tight">
            Session Expired
          </h2>
          <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto font-medium">
            Your active scholarly credentials session has timed out due to inactivity. Please sign in again to resume your workspace.
          </p>
        </div>

        <div className="h-px bg-border dark:bg-zinc-800/50 my-4" />

        <div className="flex flex-col space-y-2">
          <Link 
            href="/login" 
            className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-950 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4 mr-1.5 shrink-0" />
            Sign In to Portal
          </Link>
          
          <Link 
            href="/" 
            className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider border border-border dark:border-zinc-800 hover:bg-surface-muted dark:hover:bg-zinc-900/40 text-foreground py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 mr-1.5 text-muted shrink-0" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
