'use client';

import { safeApiMessage } from '../../utils/safeErrors';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { KeyRound, Mail, Loader2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { forgotPasswordSchema, validateWithZod } from '../../lib/validation';
import PageTitle from '../../components/PageTitle';

export default function ForgotPassword() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const errorRef = useRef(null);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace('/admin');
  }, [authLoading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validation = validateWithZod(forgotPasswordSchema, { email });
    if (!validation.success) {
      setError(validation.errors.email || validation.message);
      return;
    }

    setLoading(true);

    try {
      await api.post('/forgot-password', { email });
      toast('Verification instructions sent if the account exists.', 'success');
      setSubmitted(true);
    } catch (err) {
      const msg = safeApiMessage(err, 'Failed to send password reset link.');
      setError(msg);
      toast(msg, 'error');
      setTimeout(() => errorRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <>
        <PageTitle title="Forgot Password" />
        <div className="flex-grow flex flex-col justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent dark:text-accent-gold" />
          <p className="text-xs text-muted mt-4 font-semibold">Verifying session...</p>
        </div>
      </>
    );
  }

  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <PageTitle title="Forgot Password" />

      <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-accent/5 dark:bg-accent-gold/10 border border-accent/10 dark:border-accent-gold/25 rounded-full flex items-center justify-center text-accent dark:text-accent-gold">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-black text-foreground">
              Recover Password
            </h2>
            <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
              Enter your registered scholar email below and we will send you a secure link to establish a new password.
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

        {/* Form or Submitted State */}
        {submitted ? (
          <div className="space-y-4 text-center py-4">
            <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto font-medium">
              If the email address matches an active account, you will receive a secure password reset link shortly. Please check your inbox and follow the instructions to establish your new credentials.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-950 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email input */}
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                Scholar Email
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  id="forgot-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border border-border dark:border-zinc-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-655 transition-all"
                />
                <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-600 absolute left-3" />
              </div>
            </div>

            {/* Submit action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-955 py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Reset Code...
                </>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>
        )}

        {/* Back to sign in pathway */}
        <div className="text-center pt-4 border-t border-border dark:border-zinc-850">
          <p className="text-[11px] font-semibold text-muted">
            Remembered your credentials?{' '}
            <Link
              href="/login"
              className="text-accent dark:text-accent-gold hover:underline"
            >
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
