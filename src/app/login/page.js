'use client';

import { safeApiMessage } from '../../utils/safeErrors';
import { logError } from '../../utils/safeLogger';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, LayoutDashboard } from 'lucide-react';
import SeoHead from '../../components/SeoHead';
import PageTitle from '../../components/PageTitle';
import api from '../../utils/api';
import { loginSchema, validateWithZod } from '../../lib/validation';
import { resolveDashboardRedirect, withDashboardRedirect } from '../../utils/authRedirect';

export default function Login() {
  const { user, login, loginWithPayload, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPath = searchParams.get('redirect');
  const errorRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google/signin', { credential: response.credential });
      if (res.status === 202 && res.data.message === '2fa_required') {
        sessionStorage.setItem('mfa_challenge', JSON.stringify({
          token: res.data.mfa_challenge_token,
          methods: res.data.available_methods,
          defaultMethod: res.data.default_method,
          requiredMethods: res.data.required_methods,
          verifiedMethods: res.data.verified_methods,
          remainingMethods: res.data.remaining_methods,
          nextMethod: res.data.next_method,
          recoveryCodeAllowed: res.data.recovery_code_allowed,
        }));
        toast(res.data.default_method === 'email' ? 'Authentication code sent to your email.' : 'Enter a code from your authenticator app.', 'info');
        router.push(withDashboardRedirect('/verify-2fa', requestedPath));
        return;
      }
      const { user: userData, access_token } = res.data;
      loginWithPayload(userData, access_token);
      toast('Authentication successful. Welcome to ScholarlyNest!', 'success');
      router.replace(resolveDashboardRedirect(requestedPath, userData));
    } catch (err) {
      logError(err);
      if (err['response']?.status === 404 && err['response']?.data?.message === 'no_account_exists') {
        toast('No academic profile exists with this Google account. Redirecting to sign up...', 'warning');
        sessionStorage.setItem('google_signup_credential', response.credential);
        const googleInfo = err['response']?.data?.google_info;
        if (googleInfo) {
          sessionStorage.setItem('google_signup_info', JSON.stringify({
            name: googleInfo.name || '',
            email: googleInfo.email || '',
          }));
        }
        setTimeout(() => {
          router.push('/register');
        }, 1500);
      } else {
        const msg = safeApiMessage(err, 'Google Sign In failed.');
        setError(msg);
        toast(msg, 'error');
        // Shift focus to error banner
        setTimeout(() => errorRef.current?.focus(), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return;
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback
        });
        const isDark = document.documentElement.classList.contains('dark');
        const googleDiv = document.getElementById("googleSignInDiv");
        const parentWidth = googleDiv ? Math.floor(googleDiv.getBoundingClientRect().width) : 382;

        window.google.accounts.id.renderButton(
          googleDiv,
          { 
            theme: isDark ? "filled_black" : "outline", 
            size: "large", 
            text: "signin_with", 
            shape: "rectangular",
            logo_alignment: "left",
            width: parentWidth > 100 ? parentWidth : 382
          }
        );
      }
    };

    if (window.google?.accounts?.id) {
      requestAnimationFrame(() => {
        initGoogle();
      });
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  // Already authenticated user redirection
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(resolveDashboardRedirect(requestedPath, user));
    }
  }, [user, authLoading, requestedPath, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const errors = validateWithZod(loginSchema, { email, password }).errors;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast('Please correct the validation errors in your fields.', 'error');
      
      // Auto-focus first invalid field
      if (errors.email) {
        emailInputRef.current?.focus();
      } else if (errors.password) {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast('Authentication successful. Welcome to ScholarlyNest!', 'success');
      router.replace(resolveDashboardRedirect(requestedPath, result.user));
    } else if (result.verificationRequired) {
      toast('Email verification is required. A code was sent to your email.', 'warning');
      router.push(withDashboardRedirect(`/verify?email=${encodeURIComponent(result.email)}`, requestedPath));
    } else if (result.twoFactorRequired) {
      sessionStorage.setItem('mfa_challenge', JSON.stringify({
        token: result.challengeToken,
        methods: result.availableMethods,
        defaultMethod: result.defaultMethod,
        requiredMethods: result.requiredMethods,
        verifiedMethods: result.verifiedMethods,
        remainingMethods: result.remainingMethods,
        nextMethod: result.nextMethod,
        recoveryCodeAllowed: result.recoveryCodeAllowed,
      }));
      toast(result.defaultMethod === 'email' ? 'Authentication code sent to your email.' : 'Enter a code from your authenticator app.', 'info');
      router.push(withDashboardRedirect('/verify-2fa', requestedPath));
    } else {
      setError(result.message);
      toast(result.message || 'Invalid credentials provided.', 'error');
      setLoading(false);
      // Auto-focus error summary for screen readers
      setTimeout(() => errorRef.current?.focus(), 100);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center py-20">
        <PageTitle title="Login" />
        <Loader2 className="w-8 h-8 animate-spin text-accent dark:text-accent-gold" />
        <p className="text-xs text-muted mt-4 font-semibold">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <SeoHead
        title="Login"
        ogTitle="Login — ScholarlyNest"
        description="Sign in to your ScholarlyNest account to access your publishing workspace, write articles, or review submissions."
        ogUrl="/login"
      />

      <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md space-y-6">
        
        {/* Platform Identity & Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-xl bg-accent/5 dark:bg-accent-gold/10 border border-accent/10 dark:border-accent-gold/25 flex items-center justify-center text-accent dark:text-accent-gold">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-black text-foreground">
              ScholarlyNest Portal
            </h2>
            <p className="text-xs text-muted font-medium max-w-xs mx-auto leading-relaxed">
              Welcome back. Enter your credentials to manage publications, review submissions, or update your academic profile.
            </p>
          </div>
        </div>

        {/* Safe Error Notification */}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          
          {/* Email Address */}
          <div className="space-y-1.5">
            <label 
              htmlFor="login-email"
              className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono"
            >
              Academic Email
            </label>
            <div className="relative flex items-center">
              <input
                ref={emailInputRef}
                type="text"
                id="login-email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="email@university.edu"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={`w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-650 transition-all ${fieldErrors.email ? 'border-danger focus:border-danger' : 'border-border dark:border-zinc-800/80 focus:border-accent-gold dark:focus:border-accent-gold'}`}
              />
              <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-600 absolute left-3" />
            </div>
            {fieldErrors.email && (
              <span 
                id="email-error"
                className="text-[10px] text-danger font-bold mt-1 block animate-in fade-in duration-200"
              >
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label 
              htmlFor="login-password"
              className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <input
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                id="login-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="••••••••"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className={`w-full text-xs font-semibold pl-9 pr-10 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-650 transition-all ${fieldErrors.password ? 'border-danger focus:border-danger' : 'border-border dark:border-zinc-800/80 focus:border-accent-gold dark:focus:border-accent-gold'}`}
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
              <span 
                id="password-error"
                className="text-[10px] text-danger font-bold mt-1 block animate-in fade-in duration-200"
              >
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-950 py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying Credentials...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border dark:border-zinc-800/80"></div>
            <span className="flex-shrink mx-4 text-[9px] text-muted uppercase tracking-widest font-bold">Or</span>
            <div className="flex-grow border-t border-border dark:border-zinc-800/80"></div>
          </div>

          {/* Google SSO Container */}
          <div className="space-y-3">
            <div id="googleSignInDiv" className="w-full min-h-[40px] block"></div>
          </div>

        </form>

        {/* Footer Redirect Paths */}
        <div className="text-center pt-4 border-t border-border dark:border-zinc-800/40 space-y-2">
          <p className="text-[11px] font-semibold text-muted">
            Don't have an academic profile?{' '}
            <Link 
              href="/register" 
              className="text-accent dark:text-accent-gold hover:underline"
            >
              Register here
            </Link>
          </p>
          <p className="text-[11px] font-semibold text-muted">
            Forgot your password?{' '}
            <Link 
              href="/forgot-password" 
              className="text-accent dark:text-accent-gold hover:underline"
            >
              Reset here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
