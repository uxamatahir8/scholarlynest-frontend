'use client';

import { safeApiMessage } from '../../utils/safeErrors';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Mail, Loader2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { emailVerificationSchema, forgotPasswordSchema, validateWithZod } from '../../lib/validation';

function VerifyForm() {
  const { loginWithPayload } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const errorRef = useRef(null);

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validation = validateWithZod(emailVerificationSchema, { email, code });
    if (!validation.success) {
      setError(Object.values(validation.errors)[0] || validation.message);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/verify', { email, code });
      toast('Email verified successfully! Welcome to ScholarlyNest.', 'success');
      loginWithPayload(res.data.user, res.data.access_token);
      router.push('/admin');
    } catch (err) {
      const msg = safeApiMessage(err, 'Verification failed. Please check the code.');
      setError(msg);
      toast(msg, 'error');
      setTimeout(() => errorRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const validation = validateWithZod(forgotPasswordSchema, { email });
    if (!validation.success) {
      setError(Object.values(validation.errors)[0] || validation.message);
      return;
    }

    setResending(true);
    setError('');

    try {
      await api.post('/verify/resend', { email });
      toast('Verification code has been resent to your email.', 'success');
    } catch (err) {
      const msg = safeApiMessage(err, 'Failed to resend verification code.');
      setError(msg);
      toast(msg, 'error');
      setTimeout(() => errorRef.current?.focus(), 100);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md space-y-6">
      
      {/* Icon & Title Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 bg-accent/5 dark:bg-accent-gold/10 border border-accent/10 dark:border-accent-gold/25 rounded-full flex items-center justify-center text-accent dark:text-accent-gold">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-black text-foreground">
            Verify Email Address
          </h2>
          <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
            Thank you for signing up. To protect academic records, we sent a 6-digit confirmation code to your email.
          </p>
        </div>
      </div>

      {/* Safe Error Banner */}
      {error && (
        <div 
          ref={errorRef}
          tabIndex="-1"
          aria-live="assertive"
          className="flex items-start space-x-2.5 p-3.5 bg-danger/5 dark:bg-danger/10 border border-danger/25 dark:border-danger/30 rounded-xl text-danger text-xs focus:outline-none focus:ring-1 focus:ring-danger"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Verification Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        
        {/* Email Display */}
        <div className="space-y-1.5">
          <label htmlFor="verify-email" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
            Scholar Email
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              id="verify-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              disabled={!!emailParam}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border border-border dark:border-zinc-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-655 transition-all disabled:opacity-60"
            />
            <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-600 absolute left-3" />
          </div>
        </div>

        {/* Verification Code OTP input */}
        <div className="space-y-1.5">
          <label htmlFor="verify-code" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            id="verify-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            aria-invalid={!!error && !code}
            className="w-full text-center tracking-[0.5em] font-mono text-base font-bold py-2.5 bg-surface-muted dark:bg-zinc-900/30 border border-border dark:border-zinc-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-300 dark:placeholder-zinc-700"
          />
        </div>

        {/* Submit action */}
        <button
          type="submit"
          disabled={loading || resending}
          className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-950 py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying Code...
            </>
          ) : (
            'Verify & Sign In'
          )}
        </button>

        {/* Resend actions */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted pt-4 border-t border-border dark:border-zinc-850">
          <span>Didn't get a code?</span>
          <button
            type="button"
            disabled={loading || resending}
            onClick={handleResend}
            className="text-accent dark:text-accent-gold hover:underline disabled:opacity-50 focus:outline-none cursor-pointer"
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Verify() {
  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <Suspense fallback={
        <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-zinc-400 dark:text-zinc-650 animate-spin" />
          <p className="text-xs text-muted mt-4 font-semibold">Loading verification portal...</p>
        </div>
      }>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
