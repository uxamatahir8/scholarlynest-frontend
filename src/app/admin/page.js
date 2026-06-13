'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import {
  Sliders,
  ShieldCheck,
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  Activity,
  ArrowRight,
  Eye,
  MousePointerClick,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../utils/api';

export default function AdminOverview() {
  const { user, loading: authLoading, hasRole, hasPermission } = useAuth();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);

  const [auditLogs] = useState([
    { id: 1, action: 'Platform launched', desc: 'Dashboard interface successfully initialized.', time: '00:07' },
    { id: 2, action: 'Access Guard Sync', desc: 'Administrative and editorial permissions activated.', time: '00:12' },
    { id: 3, action: 'Sleek UI Deployed', desc: 'Global glassmorphic theme standardized.', time: '00:22' },
    { id: 4, action: 'Routing Modularization', desc: 'Dashboard successfully modularized into dedicated sub-sections.', time: '00:38' }
  ]);

  const isSuperAdmin = hasRole('super_admin');
  const isEditor = hasPermission('articles.view-any') || hasPermission('magazines.view-any') || hasPermission('roles.view-any') || hasPermission('users.view-any') || hasPermission('settings.view-any') || hasPermission('newsletters.view-any');
  const isAuthor = !isSuperAdmin && !isEditor;

  useEffect(() => {
    if (authLoading || !user) return;

    if (!isEditor) {
      setLoadingStats(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        setErrorStats(null);
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics database', err);
        setErrorStats('Failed to download system metrics ledger.');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, authLoading, isEditor]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left font-sans">
      <title>Admin Overview - ScholarlyNest</title>

      {/* Greeting Banner */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
          Welcome to the Console, <span className="text-amber-600 dark:text-amber-400 font-serif italic font-normal tracking-wide">{user.name.split(' ')[0]}</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-xl leading-relaxed">
          Manage access boundaries, audit manuscript submissions, and oversee platform usage CTR lists.
        </p>
      </div>

      {/* Stats Widgets */}
      {isEditor && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl flex items-center space-x-4 shadow-sm hover:border-amber-500/10 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-amber-500/[0.04] border border-amber-500/10 text-amber-605 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block font-mono">Pending Review</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white mt-1 block">
                {loadingStats ? '...' : `${stats?.articles_count?.pending ?? 0} Manuscripts`}
              </span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl flex items-center space-x-4 shadow-sm hover:border-blue-500/10 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-blue-500/[0.04] border border-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block font-mono">Magazines Catalog</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white mt-1 block">
                {loadingStats ? '...' : `${stats?.magazines_count ?? 0} Catalog Issues`}
              </span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/35 border border-zinc-200/60 dark:border-zinc-850 p-6 rounded-2xl flex items-center space-x-4 shadow-sm hover:border-emerald-500/10 transition-colors sm:col-span-2 lg:col-span-1">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block font-mono">Published Papers</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white mt-1 block">
                {loadingStats ? '...' : `${stats?.articles_count?.approved ?? 0} Approved`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Web Traffic CTR Section */}
      {isEditor && !loadingStats && stats && (
        <Card className="border border-zinc-200/80 dark:border-zinc-850 bg-white/75 dark:bg-zinc-900/20 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-850/80 px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-450">CTR & Traffic Statistics</CardTitle>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Impressions, click-through rates, and article engagements.</p>
            </div>
            <Activity className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-950/20">
                <div className="w-9 h-9 rounded-lg bg-blue-500/[0.04] border border-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Eye className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Impressions</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white block mt-0.5">{stats.analytics?.total_impressions?.toLocaleString() ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-950/20">
                <div className="w-9 h-9 rounded-lg bg-amber-500/[0.04] border border-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <MousePointerClick className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Clicks</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white block mt-0.5">{stats.analytics?.total_clicks?.toLocaleString() ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-950/20">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">CTR Average</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white block mt-0.5">{stats.analytics?.ctr ?? 0}%</span>
                </div>
              </div>
            </div>

            {/* Top Engaging Publications List */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">Top Performing Manuscripts</h3>
              {stats.top_articles && stats.top_articles.length > 0 ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-850/60 border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white/50 dark:bg-zinc-950/15">
                  {stats.top_articles.map((art, index) => {
                    const ctr = art.impressions > 0 ? ((art.clicks / art.impressions) * 100).toFixed(1) : 0;
                    return (
                      <div key={art.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0 max-w-md">
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-850 text-zinc-500 rounded">
                              #{index + 1}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-semibold truncate block">
                              {art.magazine?.title}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title={art.title}>{art.title}</h4>
                        </div>

                        <div className="flex items-center space-x-6 shrink-0 text-left font-sans text-xs">
                          <div>
                            <span className="text-[8px] text-zinc-400 uppercase font-bold block">impressions</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{art.impressions}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-400 uppercase font-bold block">clicks</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{art.clicks}</span>
                          </div>
                          <div className="w-16">
                            <span className="text-[8px] text-zinc-400 uppercase font-bold block">ctr</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">{ctr}%</span>
                          </div>
                          <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                              style={{ width: `${Math.min(parseFloat(ctr) * 5, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 border border-zinc-150 border-dashed rounded-xl text-xs text-zinc-400">
                  No public impressions recorded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid: Actions & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Operations links (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="border border-zinc-200/80 dark:border-zinc-850 bg-white/75 dark:bg-zinc-900/20 backdrop-blur-md rounded-2xl shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-850/80 px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-450">Console Operations</CardTitle>
                <Sliders className="w-4 h-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Article registry */}
                {(hasPermission('articles.view-own') || hasPermission('articles.view-any')) && (
                  <Link
                    href="/admin/articles"
                    className="p-5 bg-zinc-50/50 hover:bg-amber-500/[0.015] border border-zinc-200/60 hover:border-amber-500/15 rounded-2xl flex flex-col justify-between min-h-[140px] transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/[0.04] border border-blue-500/10 text-blue-605 flex items-center justify-center shadow-sm">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1 pt-4 text-left">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 flex items-center gap-1">
                        <span>Article Registry</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </h4>
                      <p className="text-[10px] font-medium text-zinc-405 leading-relaxed">
                        {isAuthor ? 'Submit and track draft manuscripts.' : 'Review articles, check PDF files, and moderate logs.'}
                      </p>
                    </div>
                  </Link>
                )}

                {/* Magazines directory */}
                {(hasPermission('magazines.view-any') || hasPermission('magazines.view-own')) && (
                  <Link
                    href="/admin/magazines"
                    className="p-5 bg-zinc-50/50 hover:bg-amber-500/[0.015] border border-zinc-200/60 hover:border-amber-500/15 rounded-2xl flex flex-col justify-between min-h-[140px] transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-sm">
                      <BookOpen className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1 pt-4 text-left">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 flex items-center gap-1">
                        <span>Magazines Catalog</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </h4>
                      <p className="text-[10px] font-medium text-zinc-405 leading-relaxed">Create scientific journals, compile cover images, and update metadata records.</p>
                    </div>
                  </Link>
                )}

                {/* Access control */}
                {(hasRole('super_admin') || hasPermission('roles.view-any')) && (
                  <Link
                    href="/admin/rbac"
                    className="p-5 bg-zinc-50/50 hover:bg-amber-500/[0.015] border border-zinc-200/60 hover:border-amber-500/15 rounded-2xl flex flex-col justify-between min-h-[140px] transition-all duration-300 group sm:col-span-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/[0.04] border border-amber-500/10 text-amber-600 flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1 pt-4 text-left">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 flex items-center gap-1">
                        <span>Access Permission Controls (RBAC)</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </h4>
                      <p className="text-[10px] font-medium text-zinc-405 leading-relaxed">Manage active profiles, map dynamic permission tiers, and audit ledger roles.</p>
                    </div>
                  </Link>
                )}

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit logs queue */}
        <div className="lg:col-span-1">
          <Card className="border border-zinc-200/80 dark:border-zinc-855 bg-white/75 dark:bg-zinc-900/20 backdrop-blur-md rounded-2xl shadow-sm h-full flex flex-col">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-850/80 px-6 py-4">
              <CardTitle className="text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-455">System audit logs</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-grow space-y-6 overflow-y-auto max-h-[340px]">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3.5 border-b border-zinc-100 dark:border-zinc-850/40 pb-4 last:border-b-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-150 leading-tight">{log.action}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{log.desc}</p>
                    <span className="text-[9px] font-mono font-bold text-zinc-400 block mt-2 uppercase">{log.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
