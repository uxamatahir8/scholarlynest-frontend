'use client';

import React from 'react';
import { AlertCircle, FileText, CheckCircle2, Inbox, Users, BookOpen } from 'lucide-react';

export default function DashboardStats({ stats, loading, isAdmin }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-zinc-150 dark:border-zinc-850 bg-white/40 dark:bg-zinc-900/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-sm">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col space-y-3 p-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/60 last:border-0"
          >
            <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-9 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const renderAuthorStats = () => {
    const total = stats?.total ?? 0;
    const approved = stats?.approved ?? stats?.accepted ?? 0;
    const pending = stats?.pending ?? stats?.submitted ?? 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-zinc-150 dark:border-zinc-850 bg-white/40 dark:bg-zinc-900/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-sm font-sans text-left">
        {/* Total Submitted */}
        <div className="flex items-start space-x-4 p-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/60 last:border-none">
          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850/50 text-zinc-650 dark:text-zinc-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono block">
              Total Submitted
            </span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono leading-none tracking-tight">
              {total}
            </div>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 font-medium pt-1">
              Manuscripts authored or collaborated on
            </p>
          </div>
        </div>

        {/* Accepted Manuscripts */}
        <div className="flex items-start space-x-4 p-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/60 last:border-none">
          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono block">
              Accepted Manuscripts
            </span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono leading-none tracking-tight">
              {approved}
            </div>
            <p className="text-[10px] text-zinc-455 dark:text-zinc-550 font-medium pt-1">
              Manuscripts accepted for publication
            </p>
          </div>
        </div>

        {/* Under Review */}
        <div className="flex items-start space-x-4 p-4 border-b md:border-b-0 last:border-none">
          <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono block">
              Under Review
            </span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono leading-none tracking-tight">
              {pending}
            </div>
            <p className="text-[10px] text-zinc-455 dark:text-zinc-550 font-medium pt-1">
              Submitted manuscripts awaiting review
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminStats = () => {
    const pending = stats?.articles_count?.submitted ?? stats?.articles_count?.pending ?? 0;
    const users = stats?.users_count ?? 0;
    const magazines = stats?.magazines_count ?? 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-zinc-150 dark:border-zinc-850 bg-white/40 dark:bg-zinc-900/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-sm font-sans text-left">
        {/* Submitted Review */}
        <div className="flex items-start space-x-4 p-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/60 last:border-none">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              pending > 0
                ? 'bg-amber-500/10 border border-amber-550/20 text-amber-600 dark:text-amber-400 animate-pulse'
                : 'bg-zinc-100 dark:bg-zinc-850/50 text-zinc-650'
            }`}
          >
            {pending > 0 ? <AlertCircle className="w-5 h-5" /> : <Inbox className="w-5 h-5" />}
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono block">
              Submitted Review
            </span>
            <div className={`text-3xl font-extrabold font-mono leading-none tracking-tight ${pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-white'}`}>
              {pending}
            </div>
            <p className="text-[10px] text-zinc-455 dark:text-zinc-550 font-medium pt-1">
              Manuscripts requiring editorial reviews
            </p>
          </div>
        </div>

        {/* Active Authors */}
        <div className="flex items-start space-x-4 p-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/60 last:border-none">
          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850/50 text-zinc-650 dark:text-zinc-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono block">
              Active Authors
            </span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono leading-none tracking-tight">
              {users}
            </div>
            <p className="text-[10px] text-zinc-455 dark:text-zinc-550 font-medium pt-1">
              Registered researchers and collaborators
            </p>
          </div>
        </div>

        {/* Magazines & Issues */}
        <div className="flex items-start space-x-4 p-4 border-b md:border-b-0 last:border-none">
          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850/50 text-zinc-650 dark:text-zinc-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono block">
              Magazine Issues
            </span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono leading-none tracking-tight">
              {magazines}
            </div>
            <p className="text-[10px] text-zinc-455 dark:text-zinc-550 font-medium pt-1">
              Total published magazine catalog volumes
            </p>
          </div>
        </div>
      </div>
    );
  };

  return isAdmin ? renderAdminStats() : renderAuthorStats();
}
