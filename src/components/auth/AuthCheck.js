'use client';

import { safeApiMessage } from '../../utils/safeErrors';
import { logError } from '../../utils/safeLogger';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldAlert, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';

export default function AuthCheck({ children }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (!user || !user.needs_password_reset) {
    return <>{children}</>;
  }

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (password.length < 8) {
      setErrors({ password: ['Password must be at least 8 characters.'] });
      return;
    }

    if (password !== passwordConfirmation) {
      setErrors({ password_confirmation: ['Passwords do not match.'] });
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/password/reset-enforced', {
        password: password,
        password_confirmation: passwordConfirmation,
      });

      toast('Your password has been successfully updated.', 'success');
      
      // Refresh the authenticated user session context
      await refreshUser();
    } catch (err) {
      logError(err);
      const msg = safeApiMessage(err, 'Failed to update password.');
      const backendErrors = err.response?.data?.errors || {};
      setErrors(backendErrors);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-in zoom-in-95 duration-200">
        
        {/* Shield Icon Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold uppercase tracking-wider font-serif">Security Verification</h2>
            <p className="text-xs text-zinc-400 font-medium">
              You are logging in with a temporary password. For security reasons, you must establish a new, strong password before continuing.
            </p>
          </div>
        </div>

        <div className="h-px bg-zinc-800" />

        {/* Change Password Form */}
        <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs font-semibold pl-10 pr-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-650 focus:ring-1 focus:ring-zinc-700 transition-all"
              />
            </div>
            {errors.password && (
              <p className="text-[10px] font-semibold text-red-400 mt-1">{errors.password[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">Confirm New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs font-semibold pl-10 pr-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-650 focus:ring-1 focus:ring-zinc-700 transition-all"
              />
            </div>
            {errors.password_confirmation && (
              <p className="text-[10px] font-semibold text-red-400 mt-1">{errors.password_confirmation[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-900 bg-white hover:bg-zinc-100 disabled:opacity-50 transition-colors cursor-pointer mt-6"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                <span>Saving Password...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Establish Credentials</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
