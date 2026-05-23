'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, ShieldAlert, Loader2, AlertCircle, Check, X, Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';

function ResetPasswordForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(codeParam);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
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
    if (emailParam) {
      setEmail(emailParam);
    }
    if (codeParam) {
      setCode(codeParam);
    }
    if (emailParam && codeParam) {
      const autoVerify = async () => {
        setVerifying(true);
        setError('');
        try {
          await api.post('/password/verify-reset-code', { email: emailParam, code: codeParam });
          setCodeVerified(true);
          toast('Account verified successfully. Please create your password.', 'success');
        } catch (err) {
          const msg = err.response?.data?.message || 'Invalid or expired verification code.';
          setError(msg);
        } finally {
          setVerifying(false);
        }
      };
      autoVerify();
    }
  }, [emailParam, codeParam]);

  const handleVerifyCode = async () => {
    setError('');
    setFieldErrors({});

    if (!email) {
      setFieldErrors({ email: 'Email address is required.' });
      return;
    }

    if (!code || code.length !== 6) {
      setFieldErrors({ code: 'Please enter the 6-digit verification code.' });
      return;
    }

    setVerifying(true);
    try {
      await api.post('/password/verify-reset-code', { email, code });
      setCodeVerified(true);
      toast('Verification code verified. Please set your new password.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!codeVerified) {
      toast('Please verify your code first.', 'error');
      return;
    }

    const errors = {};
    if (!password) {
      errors.password = 'New password is required.';
    } else if (!isPasswordStrong) {
      errors.password = 'Password does not meet the complexity requirements.';
    }
    if (password !== passwordConfirmation) {
      errors.passwordConfirmation = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast('Please correct the validation errors in your fields.', 'error');
      return;
    }

    setLoading(true);

    try {
      await api.post('/reset-password', {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
      toast('Password has been reset successfully! Please log in.', 'success');
      router.push('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password.';
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
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
          Reset Password
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto">
          Verify the 6-digit confirmation code sent to your academic email to unlock and reset your credentials.
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-md text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Scholar Email */}
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
              disabled={!!emailParam || codeVerified}
              className="w-full text-xs font-medium pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-400 transition-all disabled:opacity-60"
            />
            <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
          </div>
          {fieldErrors.email && (
            <span className="text-[10px] text-red-555 mt-1 block">{fieldErrors.email}</span>
          )}
        </div>

        {/* Verification Code */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Verification Code
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              maxLength={6}
              value={code}
              disabled={codeVerified}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center tracking-[0.5em] font-mono text-base font-bold py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-300 disabled:opacity-60"
            />
            {!codeVerified && (
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifying || code.length !== 6}
                className="px-6 bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
              >
                {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
              </button>
            )}
          </div>
          {fieldErrors.code && (
            <span className="text-[10px] text-red-550 dark:text-red-400 block font-semibold">{fieldErrors.code}</span>
          )}
          {codeVerified && (
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <Check className="w-3.5 h-3.5 mr-1" /> Code verified. You may now input and save your new credentials below.
            </p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            New Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              disabled={!codeVerified}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={codeVerified ? '••••••••' : 'Verify code first'}
              className="w-full text-xs font-medium pl-8 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-450 transition-all disabled:opacity-50"
            />
            <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
            {codeVerified && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors p-0.5 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
          {fieldErrors.password && (
            <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block">{fieldErrors.password}</span>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={passwordConfirmation}
              disabled={!codeVerified}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder={codeVerified ? '••••••••' : 'Verify code first'}
              className="w-full text-xs font-medium pl-8 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-450 transition-all disabled:opacity-50"
            />
            <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
            {codeVerified && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors p-0.5 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
          {fieldErrors.passwordConfirmation && (
            <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block">{fieldErrors.passwordConfirmation}</span>
          )}
        </div>

        {/* Password Strength Validation Helper Checklist */}
        {codeVerified && password && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800/60 rounded-lg space-y-2 animate-in fade-in duration-300">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Password Complexity Checklist</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center space-x-2">
                {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span>One uppercase letter</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span>One lowercase letter</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span>One number</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasSymbol ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span>One symbol (@$!%*?&)</span>
              </div>
              <div className="flex items-center space-x-2 col-span-2">
                {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span>Passwords match</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !codeVerified}
          className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-950 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-955 py-2.5 rounded-md transition-premium disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Resetting Password...
            </>
          ) : (
            'Reset Password'
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
  );
}

export default function ResetPassword() {
  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <title>Reset Password - ScholarlyNest</title>
      <Suspense fallback={
        <div className="bg-white dark:bg-[#1c1c1b] border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          <p className="text-xs text-zinc-400 mt-4">Loading reset portal...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
