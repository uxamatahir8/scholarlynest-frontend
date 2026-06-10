'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { School, Loader2, Award, LogOut } from 'lucide-react';
import api from '../../utils/api';
import { useRouter } from 'next/navigation';

export default function UniversityGateModal() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [universityName, setUniversityName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Non-removable enforcement: block the 'Escape' key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if user is super admin: if so, do not render the modal
  const isSuperAdmin = user?.roles?.some(r => r.name === 'super_admin') || user?.role?.name === 'super_admin';
  if (isSuperAdmin || !user || user.university_name) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!universityName.trim()) {
      setError('Institutional affiliation is required.');
      return;
    }

    setSubmitting(true);
    try {
      // Send PUT request to either /user/profile or /profile
      await api.put('/user/profile', {
        name: user.name,
        university_name: universityName.trim()
      });

      toast('Institutional affiliation verified. Profile active!', 'success');
      
      // Refresh auth context to update user state and close the modal
      await refreshUser();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update academic profile.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-900 dark:text-white animate-in zoom-in-95 duration-200 relative overflow-hidden">
        
        {/* Decorative background ambient glow */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-[var(--accent)] to-blue-600" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--accent)]/10 dark:bg-[var(--accent)]/5 rounded-full blur-3xl" />

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 relative z-10">
          <div className="p-3.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Award className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold uppercase tracking-wider font-serif">Profile Activation</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold max-w-xs mx-auto leading-relaxed">
              Please provide your University or Institutional Affiliation to activate your ScholarlyNest profile.
            </p>
          </div>
        </div>

        <div className="h-px bg-zinc-150 dark:bg-zinc-800" />

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono block">
              University / Institutional Affiliation
            </label>
            <div className="relative flex items-center">
              <School className="absolute left-3 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                required
                value={universityName}
                onChange={(e) => {
                  setUniversityName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Stanford University"
                className="w-full text-xs font-semibold pl-10 pr-3 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--accent)] dark:focus:border-blue-500 focus:ring-1 focus:ring-[var(--accent)] dark:focus:ring-blue-500 transition-all placeholder-zinc-400 dark:placeholder-zinc-650"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white dark:text-zinc-950 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white disabled:opacity-50 transition-colors cursor-pointer mt-6 shadow-md hover-glow"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Activating Profile...</span>
              </>
            ) : (
              <span>Activate Profile</span>
            )}
          </button>
        </form>

        <div className="h-px bg-zinc-150 dark:bg-zinc-800" />

        {/* Sign Out link to allow exits */}
        <div className="flex justify-center">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-650 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>

      </div>
    </div>
  );
}
