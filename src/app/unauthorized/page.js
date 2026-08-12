'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogIn, LayoutDashboard, BookOpen, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import SeoHead from '../../components/SeoHead';

function UnauthorizedContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || '';
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent dark:text-accent-gold" />
        <p className="text-xs text-muted mt-4 font-semibold">Loading access records...</p>
      </div>
    );
  }

  // Determine state based on user presence and parameter
  const isNotLoggedIn = !user || typeParam === 'not_logged_in';
  const isSessionExpired = typeParam === 'expired';

  let title = "Access Restricted";
  let description = "You do not have the required role permissions to access this publishing workspace section.";
  let primaryAction = (
    <Link 
      href="/admin" 
      className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-955 py-2.5 rounded-xl transition-all shadow-sm"
    >
      <LayoutDashboard className="w-4 h-4 mr-1.5 shrink-0" />
      Return to Dashboard
    </Link>
  );

  if (isNotLoggedIn) {
    title = "Authentication Required";
    description = "You must be authenticated to access this publishing workspace page.";
    primaryAction = (
      <Link 
        href="/login" 
        className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-955 py-2.5 rounded-xl transition-all shadow-sm"
      >
        <LogIn className="w-4 h-4 mr-1.5 shrink-0" />
        Sign In to Portal
      </Link>
    );
  } else if (isSessionExpired) {
    title = "Session Expired";
    description = "Your active scholarly session has closed. Please sign in again to verify your credentials.";
    primaryAction = (
      <Link 
        href="/login" 
        className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-955 py-2.5 rounded-xl transition-all shadow-sm"
      >
        <LogIn className="w-4 h-4 mr-1.5 shrink-0" />
        Sign In Again
      </Link>
    );
  }

  return (
    <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md space-y-6 text-center max-w-md w-full">
      <div className="mx-auto w-12 h-12 rounded-full bg-danger/10 border border-danger/25 flex items-center justify-center text-danger">
        <ShieldAlert className="w-6 h-6" />
      </div>
      
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-black text-foreground leading-tight">
          {title}
        </h2>
        <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto font-medium">
          {description}
        </p>
      </div>

      <div className="h-px bg-border dark:bg-zinc-800/50 my-4" />

      <div className="flex flex-col space-y-2">
        {primaryAction}
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center text-[10px] font-bold uppercase tracking-wider border border-border dark:border-zinc-800 hover:bg-surface-muted dark:hover:bg-zinc-900/40 text-foreground py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Go Back
          </button>
          <Link 
            href="/magazines" 
            className="flex items-center justify-center text-[10px] font-bold uppercase tracking-wider border border-border dark:border-zinc-800 hover:bg-surface-muted dark:hover:bg-zinc-900/40 text-foreground py-2.5 rounded-xl transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1 text-muted" />
            Explore Papers
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Unauthorized() {
  return (
    <div className="flex-grow flex flex-col justify-center items-center py-20 px-4">
      <SeoHead
        title="Unauthorized Access"
        ogTitle="Unauthorized Access — ScholarlyNest"
        description="Access restricted to authorized scholarly accounts."
        ogUrl="/unauthorized"
      />
      <Suspense fallback={
        <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md flex flex-col items-center justify-center min-h-[250px] max-w-md w-full">
          <Loader2 className="w-8 h-8 text-zinc-400 dark:text-zinc-650 animate-spin" />
          <p className="text-xs text-muted mt-4 font-semibold">Loading access context...</p>
        </div>
      }>
        <UnauthorizedContent />
      </Suspense>
    </div>
  );
}
