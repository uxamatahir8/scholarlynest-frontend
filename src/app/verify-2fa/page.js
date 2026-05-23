'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Mail, Loader2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

function Verify2FAForm() {
  const { loginWithPayload } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email address is required.');
      return;
    }

    if (!code || code.length !== 6) {
      setError('Please enter your 6-digit authentication code.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/2fa/verify', { email, code });
      toast('Two-Factor Authentication successful. Welcome back!', 'success');
      loginWithPayload(res.data.user, res.data.access_token);
      router.push('/admin');
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Please verify the code.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1c1c1b] border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg p-8 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-800 dark:text-zinc-200">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
          2-Factor Verification
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto">
          Two-factor authentication is active on your profile. Please enter the code sent to your academic email.
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
              disabled={!!emailParam}
              className="w-full text-xs font-medium pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-400 transition-all disabled:opacity-60"
            />
            <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Authentication Code
          </label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="w-full text-center tracking-[1em] font-mono text-lg font-bold py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-300"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-950 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 py-2.5 rounded-md transition-premium disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Verifying Code...
            </>
          ) : (
            'Verify & Sign In'
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
          Want to change login methods?{' '}
          <Link 
            href="/login" 
            className="text-zinc-700 dark:text-zinc-300 hover:underline"
          >
            Go back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function Verify2FA() {
  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <title>Two-Factor Authentication - ScholarlyNest</title>
      <Suspense fallback={
        <div className="bg-white dark:bg-[#1c1c1b] border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          <p className="text-xs text-zinc-400 mt-4">Loading verification challenge...</p>
        </div>
      }>
        <Verify2FAForm />
      </Suspense>
    </div>
  );
}
