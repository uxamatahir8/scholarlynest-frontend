'use client';

import { safeApiMessage } from '../../utils/safeErrors';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, ShieldAlert, Loader2, AlertCircle, Check, X, Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';
import { resetPasswordFormSchema, validateWithZod } from '../../lib/validation';

function ResetPasswordForm() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  const errorRef = useRef(null);

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Password rules checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password);
  const passwordsMatch = password && password === passwordConfirmation;
  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  useEffect(() => {
    if (!authLoading && user) router.replace('/admin');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!emailParam || !tokenParam) {
      setVerifying(false);
      setVerificationFailed(true);
      return;
    }

    const autoVerify = async () => {
      setVerifying(true);
      setError('');
      try {
        await api.post('/password/verify-reset-code', { email: emailParam, token: tokenParam });
        setCodeVerified(true);
      } catch (err) {
        setVerificationFailed(true);
        const msg = safeApiMessage(err, 'Your password reset link is invalid or has expired.');
        setError(msg);
      } finally {
        setVerifying(false);
      }
    };
    autoVerify();
  }, [emailParam, tokenParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!codeVerified) {
      return;
    }

    const validation = validateWithZod(resetPasswordFormSchema, {
      email: emailParam,
      token: tokenParam,
      password,
      passwordConfirmation,
    });

    if (!validation.success) {
      setFieldErrors(validation.errors);
      toast('Please correct the validation errors in your fields.', 'error');
      return;
    }

    setLoading(true);

    try {
      await api.post('/reset-password', {
        email: emailParam,
        token: tokenParam,
        password,
        password_confirmation: passwordConfirmation,
      });
      toast('Password has been reset successfully! Please log in.', 'success');
      router.push('/login');
    } catch (err) {
      const msg = safeApiMessage(err, 'Failed to reset password.');
      setError(msg);
      toast(msg, 'error');
      setTimeout(() => errorRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md flex flex-col items-center justify-center min-h-[250px]">
        <Loader2 className="w-8 h-8 text-amber-600 dark:text-accent-gold animate-spin" />
        <p className="text-xs text-muted mt-4 font-semibold">Verifying reset credentials...</p>
      </div>
    );
  }

  if (verificationFailed) {
    return (
      <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md space-y-6 text-center animate-in fade-in duration-200">
        <div className="mx-auto w-12 h-12 bg-danger/10 border border-danger/25 rounded-full flex items-center justify-center text-danger">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-black text-foreground text-center">
            Link Invalid or Expired
          </h2>
          <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto font-medium">
            Your password reset link is invalid or has expired. Please request a new link.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-950 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md space-y-6 animate-in fade-in duration-200">

      {/* Title */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 bg-accent/5 dark:bg-accent-gold/10 border border-accent/10 dark:border-accent-gold/25 rounded-full flex items-center justify-center text-accent dark:text-accent-gold">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-black text-foreground">
            Establish New Password
          </h2>
          <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
            Please enter your new secure password credentials to authorize and update your scholar account.
          </p>
        </div>
      </div>

      {/* Error notification summary */}
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

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* New Password */}
        <div className="space-y-1.5">
          <label htmlFor="reset-password" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
            New Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              id="reset-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!fieldErrors.password}
              className="w-full text-xs font-semibold pl-9 pr-10 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border border-border dark:border-zinc-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-655 transition-all"
            />
            <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-600 absolute left-3" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 text-zinc-400 dark:text-zinc-600 hover:text-foreground transition-colors p-0.5 focus:outline-none focus:ring-1 focus:ring-accent-gold rounded"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-[10px] text-danger font-semibold mt-1 block">{fieldErrors.password}</span>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="reset-confirm" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="reset-confirm"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!fieldErrors.passwordConfirmation}
              className="w-full text-xs font-semibold pl-9 pr-10 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border border-border dark:border-zinc-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-655 transition-all"
            />
            <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-600 absolute left-3" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
              className="absolute right-3 text-zinc-400 dark:text-zinc-600 hover:text-foreground transition-colors p-0.5 focus:outline-none focus:ring-1 focus:ring-accent-gold rounded"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.passwordConfirmation && (
            <span className="text-[10px] text-danger font-semibold mt-1 block">{fieldErrors.passwordConfirmation}</span>
          )}
        </div>

        {/* Password Strength Validation Checklist */}
        {password && (
          <div className="p-4 bg-surface-muted dark:bg-zinc-900/30 border border-border dark:border-zinc-800/60 rounded-xl space-y-2 animate-in fade-in duration-300 text-left">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted">Password Security Guidance</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-550 dark:text-zinc-400">
              <div className="flex items-center space-x-1.5">
                {hasMinLength ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <X className="w-3.5 h-3.5 text-danger shrink-0" />}
                <span>8+ Characters</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {hasUppercase ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <X className="w-3.5 h-3.5 text-danger shrink-0" />}
                <span>Uppercase letter</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {hasLowercase ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <X className="w-3.5 h-3.5 text-danger shrink-0" />}
                <span>Lowercase letter</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {hasNumber ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <X className="w-3.5 h-3.5 text-danger shrink-0" />}
                <span>Number digit</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {hasSymbol ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <X className="w-3.5 h-3.5 text-danger shrink-0" />}
                <span>Special Symbol</span>
              </div>
              <div className="flex items-center space-x-1.5 col-span-2">
                {passwordsMatch ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <X className="w-3.5 h-3.5 text-danger shrink-0" />}
                <span>Passwords match</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !isPasswordStrong || !passwordsMatch}
          className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-955 py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting Password...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      {/* Redirect back to Login */}
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
  );
}

export default function ResetPassword() {
  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <Suspense fallback={
        <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-zinc-400 dark:text-zinc-650 animate-spin" />
          <p className="text-xs text-muted mt-4 font-semibold">Loading reset portal...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
