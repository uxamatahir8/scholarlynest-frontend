'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, User as UserIcon, Loader2, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';
import api from '../../utils/api';

export default function Register() {
  const { user, register: registerUser, loginWithPayload, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);

  // Password rules checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password);
  const passwordsMatch = password && password === passwordConfirmation;
  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  // Pre-fill fields if redirected from login with Google details
  useEffect(() => {
    const savedInfoStr = sessionStorage.getItem('google_signup_info');
    if (savedInfoStr) {
      try {
        const info = JSON.parse(savedInfoStr);
        if (info.name) setName(info.name);
        if (info.email) setEmail(info.email);
      } catch (e) {
        console.error('Failed to parse saved Google info:', e);
      }
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google/signup', { credential: response.credential });
      if (res.status === 202 && res.data.message === '2fa_required') {
        toast('Two-factor authentication code sent to your email.', 'info');
        router.push(`/verify-2fa?email=${encodeURIComponent(res.data.email)}`);
        return;
      }
      const { user: userData, access_token } = res.data;
      loginWithPayload(userData, access_token);
      toast('Profile successfully registered. Welcome to ScholarlyNest!', 'success');
      // Clear session storage on success
      sessionStorage.removeItem('google_signup_credential');
      sessionStorage.removeItem('google_signup_info');
      router.push('/admin');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 422 && err.response?.data?.message === 'account_already_exists') {
        toast('An academic profile already exists with this Google account. Redirecting to login...', 'info');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        const msg = err.response?.data?.message || 'Google Sign Up failed.';
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
        const googleDiv = document.getElementById("googleSignUpDiv");
        const parentWidth = googleDiv ? Math.floor(googleDiv.getBoundingClientRect().width) : 382;

        window.google.accounts.id.renderButton(
          googleDiv,
          { 
            theme: isDark ? "filled_black" : "outline", 
            size: "large", 
            text: "signup_with", 
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
    setFieldErrors({});

    // Client-side Custom Validation
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Full Name or Academic Title is required.';
    } else if (name.trim().length < 2) {
      errors.name = 'Academic Title must be at least 2 characters.';
    }

    if (!email.trim()) {
      errors.email = 'Academic email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address (e.g. fleming@university.edu).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!passwordConfirmation) {
      errors.passwordConfirmation = 'Please confirm your password.';
    } else if (password !== passwordConfirmation) {
      errors.passwordConfirmation = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.passwordConfirmation) {
        setError('Passwords do not match.');
      }
      toast('Please correct the validation errors in your fields.', 'error');
      return;
    }

    setLoading(true);

    const result = await registerUser(name, email, password, passwordConfirmation, subscribeNewsletter);

    if (result.success && result.verificationRequired) {
      toast('Profile registered. Please check your email for the verification code!', 'success');
      router.push(`/verify?email=${encodeURIComponent(result.email)}`);
    } else if (result.success) {
      toast('Profile successfully registered. Welcome to ScholarlyNest!', 'success');
      router.push('/admin');
    } else {
      setError(result.message);
      toast(result.message || 'Registration failed.', 'error');
      if (result.errors) {
        setFieldErrors(result.errors);
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <title>Register  - ScholarlyNest</title>
      {/* <Breadcrumbs customLabels={{ register: 'Scholar Registration' }} /> */}

      <div className="bg-white dark:bg-[#1c1c1b] border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg p-8 shadow-sm space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
            Scholar Registration
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Create your academic profile to write papers and submit manuscripts.
          </p>
        </div>

        {/* Global Error Notification */}
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
              Full Name / Academic Title
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                placeholder="Dr. Alexander Fleming"
                className={`w-full text-xs font-medium pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border rounded-md focus:outline-none placeholder-zinc-400 transition-all ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700'}`}
              />
              <UserIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
            </div>
            {fieldErrors.name && (
              <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block animate-in fade-in duration-200">
                {Array.isArray(fieldErrors.name) ? fieldErrors.name[0] : fieldErrors.name}
              </span>
            )}
          </div>

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
                placeholder="fleming@university.edu"
                className={`w-full text-xs font-medium pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border rounded-md focus:outline-none placeholder-zinc-400 transition-all ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700'}`}
              />
              <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
            </div>
            {fieldErrors.email && (
              <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block animate-in fade-in duration-200">
                {Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Password
            </label>
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
                placeholder="Minimum 8 characters"
                className={`w-full text-xs font-medium pl-8 pr-10 py-2 bg-zinc-50 dark:bg-zinc-900/50 border rounded-md focus:outline-none placeholder-zinc-400 transition-all ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700'}`}
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
              <span className="text-[10px] text-red-555 dark:text-red-400 font-semibold mt-1 block animate-in fade-in duration-200">
                {Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : fieldErrors.password}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordConfirmation}
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value);
                  if (fieldErrors.passwordConfirmation) {
                    setFieldErrors(prev => ({ ...prev, passwordConfirmation: '' }));
                  }
                }}
                placeholder="Confirm password"
                className={`w-full text-xs font-medium pl-8 pr-10 py-2 bg-zinc-50 dark:bg-zinc-900/50 border rounded-md focus:outline-none placeholder-zinc-400 transition-all ${fieldErrors.passwordConfirmation ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-zinc-200 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700'}`}
              />
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors p-0.5 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.passwordConfirmation && (
              <span className="text-[10px] text-red-550 dark:text-red-400 font-semibold mt-1 block animate-in fade-in duration-200">
                {Array.isArray(fieldErrors.passwordConfirmation) ? fieldErrors.passwordConfirmation[0] : fieldErrors.passwordConfirmation}
              </span>
            )}
          </div>

          {/* Password Strength Validation Helper Checklist */}
          {password && (
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

          {/* Newsletter Subscription Option */}
          <div className="flex items-start space-x-2.5 pt-1 pb-2">
            <input
              type="checkbox"
              id="subscribeNewsletter"
              checked={subscribeNewsletter}
              onChange={(e) => setSubscribeNewsletter(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:ring-zinc-500 cursor-pointer"
            />
            <label htmlFor="subscribeNewsletter" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer select-none leading-tight">
              I would like to subscribe to the ScholarlyNest newsletter to receive scientific announcements and updates on new magazine issues.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-950 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 py-2.5 rounded-md transition-premium disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Registering Profile...
              </>
            ) : (
              'Register Profile'
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Or</span>
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>

          <div className="space-y-3">
            <div id="googleSignUpDiv" className="w-full min-h-[40px] block"></div>
          </div>

        </form>

        {/* Redirect Footer */}
        <div className="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            Already have an academic profile?{' '}
            <Link
              href="/login"
              className="text-zinc-700 dark:text-zinc-300 hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
