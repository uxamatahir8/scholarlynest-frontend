'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';
import api from '../../utils/api';

export default function Login() {
  const { user, login, loginWithPayload, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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
        toast('Two-factor authentication code sent to your email.', 'info');
        router.push(`/verify-2fa?email=${encodeURIComponent(res.data.email)}`);
        return;
      }
      const { user: userData, access_token } = res.data;
      loginWithPayload(userData, access_token);
      toast('Authentication successful. Welcome to ScholarlyNest!', 'success');
      router.push('/admin');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404 && err.response?.data?.message === 'no_account_exists') {
        toast('No academic profile exists with this Google account. Redirecting to sign up...', 'warning');
        // Store credential and info for pre-filling on sign up
        sessionStorage.setItem('google_signup_credential', response.credential);
        if (err.response.data.google_info) {
          sessionStorage.setItem('google_signup_info', JSON.stringify(err.response.data.google_info));
        }
        setTimeout(() => {
          router.push('/register');
        }, 1500);
      } else {
        const msg = err.response?.data?.message || 'Google Sign In failed.';
        setError(msg);
        toast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '606295156376-526b5jjq2lbdc2i10v9l1phaa32sc7qd.apps.googleusercontent.com',
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
      // Use requestAnimationFrame to ensure layout is fully computed
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
      router.push('/admin');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Custom Client-Side Validation
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Academic email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address (e.g. name@university.edu).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast('Please correct the validation errors in your fields.', 'error');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast('Authentication successful. Welcome to ScholarlyNest!', 'success');
      router.push('/admin');
    } else if (result.verificationRequired) {
      toast('Email verification is required. A code was sent to your email.', 'warning');
      router.push(`/verify?email=${encodeURIComponent(result.email)}`);
    } else if (result.twoFactorRequired) {
      toast('Two-factor authentication code sent to your email.', 'info');
      router.push(`/verify-2fa?email=${encodeURIComponent(result.email)}`);
    } else {
      setError(result.message);
      toast(result.message || 'Invalid credentials provided.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <title>Login  - ScholarlyNest</title>
      {/* <Breadcrumbs customLabels={{ login: 'Session Login' }} /> */}

      <div className="bg-white dark:bg-[#1c1c1b] border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
            Access Publishing Portal
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Log in to draft articles, manage posts, or sync roles.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-md text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Scholar Email
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="email@university.edu"
                className={`w-full text-xs font-medium pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border rounded-md focus:outline-none placeholder-zinc-400 transition-all ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700'}`}
              />
              <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
            </div>
            {fieldErrors.email && (
              <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block animate-in fade-in duration-200">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Password
              </label>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="••••••••"
                className={`w-full text-xs font-medium pl-8 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border rounded-md focus:outline-none placeholder-zinc-400 transition-all ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700'}`}
              />
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors p-0.5 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block animate-in fade-in duration-200">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-950 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 py-2.5 rounded-md transition-premium disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Or</span>
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>

          <div className="space-y-3">
            <div id="googleSignInDiv" className="w-full min-h-[40px] block"></div>
          </div>

        </form>

        {/* Redirect Footer */}
        <div className="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/40 space-y-2">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            Don't have an academic profile?{' '}
            <Link 
              href="/register" 
              className="text-zinc-700 dark:text-zinc-300 hover:underline"
            >
              Register here
            </Link>
          </p>
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            Forgot your password?{' '}
            <Link 
              href="/forgot-password" 
              className="text-zinc-700 dark:text-zinc-300 hover:underline"
            >
              Reset here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
