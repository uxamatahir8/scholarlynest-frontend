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

  // Determine user role scope
  const isSuperAdmin = hasRole('super_admin');
  const isEditor = hasPermission('articles.view-any') || hasPermission('magazines.view-any') || hasPermission('roles.view-any') || hasPermission('users.view-any') || hasPermission('settings.view-any') || hasPermission('newsletters.view-any');
  const isAuthor = !isSuperAdmin && !isEditor;

  useEffect(() => {
    if (authLoading || !user) return;

    // Only administrators/editors have access to stats
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <title>Admin Overview - ScholarlyNest</title>

      {/* Header Greeting */}
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[var(--accent)]/10 rounded-full blur-3xl" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)] relative z-10">
          Welcome to the Console, <span className="text-[var(--accent)] dark:text-blue-400 font-serif italic">{user.name.split(' ')[0]}</span>
        </h1>
        <p className="text-sm text-[var(--muted)] mt-2 font-medium max-w-2xl relative z-10">
          Manage system roles, oversee platform analytics, and control access boundaries from your central workspace.
        </p>
      </div>

      {/* STATISTICS WIDGETS */}
      {isEditor && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border border-[var(--muted-border)]/60 hover-glow transition-all duration-300 bg-[var(--card-bg)]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">Pending Manuscripts</span>
              <span className="text-2xl font-bold text-[var(--foreground)] mt-0.5 block">
                {loadingStats ? '...' : `${stats?.articles_count?.pending ?? 0} Pending`}
              </span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border border-[var(--muted-border)]/60 hover-glow transition-all duration-300 bg-[var(--card-bg)]">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">Magazines Catalog</span>
              <span className="text-2xl font-bold text-[var(--foreground)] mt-0.5 block">
                {loadingStats ? '...' : `${stats?.magazines_count ?? 0} Issues`}
              </span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border border-[var(--muted-border)]/60 hover-glow transition-all duration-300 sm:col-span-2 lg:col-span-1 bg-[var(--card-bg)]">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">Approved Manuscripts</span>
              <span className="text-2xl font-bold text-[var(--foreground)] mt-0.5 block">
                {loadingStats ? '...' : `${stats?.articles_count?.approved ?? 0} Published`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED WEB ANALYTICS & CTR REPORTS */}
      {isEditor && !loadingStats && stats && (
        <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md overflow-hidden animate-in fade-in duration-500">
          <CardHeader className="border-b border-[var(--muted-border)]/60 bg-black/5 dark:bg-white/5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">Traffic & Engagement Analytics</CardTitle>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">Real-time impressions, click metrics, and overall click-through rates.</p>
              </div>
              <Activity className="w-4 h-4 text-[var(--accent)]" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

              <div className="flex items-center space-x-3 p-4 rounded-xl bg-[var(--background)]/40 border border-[var(--muted-border)]/65">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">Total Impressions</span>
                  <span className="text-xl font-bold text-[var(--foreground)] block mt-0.5">{stats.analytics?.total_impressions?.toLocaleString() ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-xl bg-[var(--background)]/40 border border-[var(--muted-border)]/65">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">Total Clicks</span>
                  <span className="text-xl font-bold text-[var(--foreground)] block mt-0.5">{stats.analytics?.total_clicks?.toLocaleString() ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-xl bg-[var(--background)]/40 border border-[var(--muted-border)]/65">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">Avg. Click-Through Rate</span>
                  <span className="text-xl font-bold text-[var(--foreground)] block mt-0.5">{stats.analytics?.ctr ?? 0}%</span>
                </div>
              </div>

            </div>

            {/* TOP PUBLICATIONS LIST */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] mb-4 font-mono">Top Engaging Publications</h3>
              {stats.top_articles && stats.top_articles.length > 0 ? (
                <div className="space-y-4">
                  {stats.top_articles.map((art, index) => {
                    const ctr = art.impressions > 0 ? ((art.clicks / art.impressions) * 100).toFixed(1) : 0;
                    return (
                      <div key={art.id} className="p-4 rounded-xl border border-[var(--muted-border)]/60 bg-[var(--background)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-mono font-bold bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded">
                              #{index + 1}
                            </span>
                            <span className="text-[10px] text-[var(--muted)] font-medium">
                              {art.magazine?.title}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[var(--foreground)] line-clamp-1">{art.title}</h4>
                        </div>

                        <div className="flex items-center space-x-6 shrink-0">
                          <div className="text-right">
                            <span className="text-[9px] text-[var(--muted)] uppercase font-bold block">Impressions</span>
                            <span className="text-xs font-bold text-[var(--foreground)]">{art.impressions}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-[var(--muted)] uppercase font-bold block">Clicks</span>
                            <span className="text-xs font-bold text-[var(--foreground)]">{art.clicks}</span>
                          </div>
                          <div className="text-right w-16">
                            <span className="text-[9px] text-[var(--muted)] uppercase font-bold block">CTR</span>
                            <span className="text-xs font-bold text-[var(--accent-gold)]">{ctr}%</span>
                          </div>

                          {/* Visual mini bar */}
                          <div className="w-16 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-gold)] rounded-full"
                              style={{ width: `${Math.min(parseFloat(ctr) * 5, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 rounded-xl border border-[var(--muted-border)]/50 border-dashed text-[var(--muted)]">
                  No public impressions recorded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SPLIT COLUMN: QUICK START & LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Panel: Primary Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="h-full border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]">Console Operations</CardTitle>
                <Sliders className="w-4 h-4 text-[var(--muted)]" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* 1. Manuscripts Card */}
                {(hasPermission('articles.view-own') || hasPermission('articles.view-any')) && (
                  <Link
                    href="/admin/articles"
                    className="p-6 glass-panel rounded-2xl text-left flex flex-col justify-between min-h-[160px] transition-premium hover-glow group border border-transparent hover:border-blue-500/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <span>Article Registry</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h4>
                      <p className="text-[11px] font-medium text-[var(--muted)] mt-1.5 leading-relaxed">
                        {isAuthor ? 'Submit and track your research manuscript status.' : 'Inspect submissions, assign peers, and approve drafts.'}
                      </p>
                    </div>
                  </Link>
                )}

                {/* 2. Magazines Card */}
                {(hasPermission('magazines.view-any') || hasPermission('magazines.view-own')) && (
                  <Link
                    href="/admin/magazines"
                    className="p-6 glass-panel rounded-2xl text-left flex flex-col justify-between min-h-[160px] transition-premium hover-glow group border border-transparent hover:border-emerald-500/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <span>Magazines Catalog</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h4>
                      <p className="text-[11px] font-medium text-[var(--muted)] mt-1.5 leading-relaxed">Create scientific journals, edit descriptions, and update cover images.</p>
                    </div>
                  </Link>
                )}

                {/* 3. Access Control (Visible to Super Admins and User Managers) */}
                {(hasRole('super_admin') || hasPermission('roles.view-any')) && (
                  <Link
                    href="/admin/rbac"
                    className="p-6 glass-panel rounded-2xl text-left flex flex-col justify-between min-h-[160px] transition-premium hover-glow group border border-transparent hover:border-[var(--accent-gold)]/30 sm:col-span-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <span>Role Permissions (RBAC)</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h4>
                      <p className="text-[11px] font-medium text-[var(--muted)] mt-1.5 leading-relaxed">Interactive role mapping panel. Audit and update user security tiers.</p>
                    </div>
                  </Link>
                )}

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Active System Audit Logs */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]">System Audit Logs</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 flex-grow space-y-6 max-h-[360px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-4 border-b border-[var(--muted-border)]/35 pb-4 last:border-b-0 last:pb-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] mt-1 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)] leading-tight">{log.action}</p>
                    <p className="text-[10px] font-medium text-[var(--muted)] mt-1.5 leading-relaxed">{log.desc}</p>
                    <span className="text-[9px] font-mono text-[var(--muted)] block mt-2 uppercase">{log.time}</span>
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
