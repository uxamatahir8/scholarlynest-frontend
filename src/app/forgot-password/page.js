'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../../context/ToastContext';
import { KeyRound, Mail, Loader2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

export default function ForgotPassword() {
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your academic email address.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/forgot-password', { email });
      toast('Verification code sent to your email. Redirecting...', 'success');
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send password reset code.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <title>Forgot Password - ScholarlyNest</title>

      <div className="bg-white dark:bg-[#1c1c1b] border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-800 dark:text-zinc-200">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
            Forgot Password
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto">
            Enter your email below and we will send you a 6-digit code to reset your password.
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-md text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Scholar Email
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full text-xs font-medium pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-400 transition-all"
              />
              <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-950 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 py-2.5 rounded-md transition-premium disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Sending Code...
              </>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            Remembered your credentials?{' '}
            <Link 
              href="/login" 
              className="text-zinc-700 dark:text-zinc-300 hover:underline"
            >
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
