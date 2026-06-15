'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';
import DashboardStats from '../../components/dashboard/DashboardStats';
import QuickActions from '../../components/dashboard/QuickActions';
import UniversityGateModal from '../../components/dashboard/UniversityGateModal';
import { Loader2, ShieldAlert, Award, Calendar, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AdminOverview() {
  const { user, loading: authLoading, hasPermission, hasRole } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const isAdminOrEditor = hasPermission ? (
    hasPermission('articles.approve') || 
    hasPermission('articles.auto-approve') || 
    hasRole('super_admin') || 
    hasRole('admin') || 
    hasRole('editor')
  ) : false;

  const isSuperAdmin = hasRole ? hasRole('super_admin') : false;

  // Fetch telemetry/stats data
  useEffect(() => {
    if (authLoading || !user) return;

    // Evaluate University Gate: if missing and not super admin, don't run fetches
    if (!user.university_name && !isSuperAdmin) {
      setStatsLoading(false);
      return;
    }

    const fetchStatsData = async () => {
      try {
        setStatsLoading(true);
        if (isAdminOrEditor) {
          // Admin telemetry
          const response = await api.get('/admin/stats');
          setStats(response.data);
        } else {
          // Author parallel pagination queries
          const [totalRes, approvedRes, pendingRes] = await Promise.all([
            api.get('/admin/articles', { params: { per_page: 1 } }),
            api.get('/admin/articles', { params: { status: 'accepted', per_page: 1 } }),
            api.get('/admin/articles', { params: { status: 'submitted', per_page: 1 } })
          ]);
          setStats({
            total: totalRes.data.total || 0,
            approved: approvedRes.data.total || 0,
            pending: pendingRes.data.total || 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
        toast('Failed to download dashboard statistics.', 'error');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatsData();
  }, [user, authLoading, isAdminOrEditor, isSuperAdmin]);

  // Loading state for auth
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-605" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
          Syncing Account Context...
        </span>
      </div>
    );
  }

  // Not authenticated fallback
  if (!user) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start space-x-4 max-w-xl mx-auto mt-16 animate-in fade-in">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <div className="text-left font-sans">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-750">Session Expired</h3>
          <p className="text-xs text-red-600 dark:text-red-350 mt-1">
            Please{' '}
            <Link href="/login" className="font-bold underline text-amber-600 dark:text-amber-400">
              sign in
            </Link>{' '}
            to view your publisher dashboard.
          </p>
        </div>
      </div>
    );
  }

  // If university name is missing and not a super admin, render the gate modal instantly
  if (!user.university_name && !isSuperAdmin) {
    return <UniversityGateModal />;
  }

  // Render the fully loaded dashboard
  const userRoleDisplay = isAdminOrEditor ? 'Editorial Administrator' : 'Academic Author';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left font-sans">
      <title>Publisher Dashboard - ScholarlyNest</title>
      
      {/* Decorative top modal check */}
      <UniversityGateModal />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 dark:border-zinc-900 pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase bg-amber-500/10 text-amber-605 dark:text-amber-400 border border-amber-550/10">
              {userRoleDisplay}
            </span>
            {user.university_name && (
              <span className="text-[10px] text-zinc-400 font-semibold truncate max-w-xs" title={user.university_name}>
                @{user.university_name}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Manage your submissions, examine review parameters, and track publishing progress.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 font-mono uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-850 px-3.5 py-2 rounded-xl self-start sm:self-auto shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-amber-550" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Module 1: Numerical Stats display */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
          Operational Telemetry
        </h3>
        <DashboardStats stats={stats} loading={statsLoading} isAdmin={isAdminOrEditor} />
      </div>

      {/* Module 2: Dashboard Content Stack */}
      <div className="space-y-8">
        <QuickActions isAdmin={isAdminOrEditor} />

        {/* Welcome Info Card */}
        <div className="p-6 border border-zinc-200/80 dark:border-zinc-855 bg-white/40 dark:bg-zinc-900/10 rounded-2xl shadow-sm space-y-4">
          <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Open Science Advocate Pledge</span>
          </h4>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-medium">
            ScholarlyNest stands by its commitment to free, unrestricted public research. All mathematical proofs, computational files, and scientific statistics published inside our magazine issues remain permanently open-access and read-unrestricted under the Creative Commons framework.
          </p>
          <div className="flex flex-wrap gap-4 text-[9px] font-bold uppercase tracking-widest font-mono text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-amber-555" />
              No Paywalls
            </span>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-555" />
              Fast Track Peer-Review
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
