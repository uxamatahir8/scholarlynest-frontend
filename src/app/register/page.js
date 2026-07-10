'use client';

import { safeApiMessage } from '../../utils/safeErrors';
import { logError } from '../../utils/safeLogger';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, User as UserIcon, Loader2, AlertCircle, Eye, EyeOff, Check, X, School, Info, ArrowRight, BookOpen, Contact } from 'lucide-react';
import SeoHead from '../../components/SeoHead';
import api from '../../utils/api';
import { registerSchema, validateWithZod } from '../../lib/validation';

export default function Register() {
  const { user, register: registerUser, loginWithPayload, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const errorRef = useRef(null);
  
  // Field references for focus management
  const nameRef = useRef(null);
  const universityRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Flow State: 1 = Profile Info, 2 = Security Credentials
  const [step, setStep] = useState(1);
  const [isClosed, setIsClosed] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [universityName, setUniversityName] = useState('');
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
        logError('Failed to parse saved Google info:', e);
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
      sessionStorage.removeItem('google_signup_credential');
      sessionStorage.removeItem('google_signup_info');
      router.push('/admin');
    } catch (err) {
      logError(err);
      if (err['response']?.status === 403 && err['response']?.data?.message === 'Registration is currently closed.') {
        setIsClosed(true);
        toast('Registration is currently closed.', 'error');
      } else if (err['response']?.status === 422 && err['response']?.data?.message === 'account_already_exists') {
        toast('An academic profile already exists with this Google account. Redirecting to login...', 'info');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        const msg = safeApiMessage(err, 'Google Sign Up failed.');
        setError(msg);
        toast(msg, 'error');
        setTimeout(() => errorRef.current?.focus(), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id && !isClosed) {
        if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return;
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback
        });
        const isDark = document.documentElement.classList.contains('dark');
        const googleDiv = document.getElementById("googleSignUpDiv");
        if (!googleDiv) return;
        const parentWidth = Math.floor(googleDiv.getBoundingClientRect().width);

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

    if (!isClosed) {
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
    }
  }, [isClosed]);

  // Already authenticated user redirection
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/admin');
    }
  }, [user, authLoading, router]);

  // Validation logic for Step 1
  const validateStep1 = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Full Name or Academic Title is required.';
    } else if (name.trim().length < 2) {
      errors.name = 'Academic Title must be at least 2 characters.';
    }

    if (!universityName.trim()) {
      errors.university_name = 'University or Institutional Affiliation is required.';
    }

    if (!email.trim()) {
      errors.email = 'Academic email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address (e.g. fleming@university.edu).';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast('Please correct fields in Step 1 before continuing.', 'error');
      if (errors.name) nameRef.current?.focus();
      else if (errors.university_name) universityRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      // Wait to render step 2 inputs and focus password
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Final Validation
    const errors = {};
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
      toast('Please correct verification errors in Step 2.', 'error');
      if (errors.password) passwordRef.current?.focus();
      else if (errors.passwordConfirmation) confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);

    const result = await registerUser(name, email, password, passwordConfirmation, subscribeNewsletter, universityName);

    if (result.success && result.verificationRequired) {
      toast('Profile registered. Please check your email for the verification code!', 'success');
      router.push(`/verify?email=${encodeURIComponent(result.email)}`);
    } else if (result.success) {
      toast('Profile successfully registered. Welcome to ScholarlyNest!', 'success');
      router.push('/admin');
    } else {
      if (result.message === 'Registration is currently closed.') {
        setIsClosed(true);
        toast('Registration is currently closed.', 'error');
      } else {
        setError(result.message);
        toast(result.message || 'Registration failed.', 'error');
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        setTimeout(() => errorRef.current?.focus(), 100);
      }
      setLoading(false);
    }
  };

  // RENDER: Closed registration state fallback
  if (isClosed) {
    return (
      <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
        <SeoHead
          title="Registration Closed — ScholarlyNest"
          description="Scholar registration is currently closed. Learn how to establish institutional profiles."
          ogUrl="/register"
        />
        <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md space-y-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-black text-foreground">
              Registration Closed
            </h2>
            <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto">
              Public user registration is currently disabled by the ScholarlyNest administration. Access to submit manuscripts is restricted to authorized academic institutions and assigned researchers.
            </p>
          </div>

          <div className="h-px bg-border dark:bg-zinc-800/50 my-4" />

          <div className="flex flex-col space-y-2">
            <Link 
              href="/login" 
              className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-950 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Go to Login
              <ArrowRight className="w-4 h-4 ml-1.5 shrink-0" />
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link 
                href="/contact" 
                className="flex items-center justify-center text-[10px] font-bold uppercase tracking-wider border border-border dark:border-zinc-800 hover:bg-surface-muted dark:hover:bg-zinc-900/40 text-foreground py-2.5 rounded-xl transition-colors"
              >
                <Contact className="w-3.5 h-3.5 mr-1 text-muted" />
                Contact Desk
              </Link>
              <Link 
                href="/magazines" 
                className="flex items-center justify-center text-[10px] font-bold uppercase tracking-wider border border-border dark:border-zinc-800 hover:bg-surface-muted dark:hover:bg-zinc-900/40 text-foreground py-2.5 rounded-xl transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1 text-muted" />
                Browse Issues
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full py-12 px-4 sm:px-6">
      <SeoHead
        title="Register — ScholarlyNest"
        description="Create your academic profile to write papers, submit manuscripts, and join the ScholarlyNest research community."
        ogUrl="/register"
      />

      <div className="bg-surface dark:bg-[#121316] border border-border dark:border-zinc-800/80 rounded-2xl p-8 shadow-md space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent dark:text-accent-gold font-mono">
            Step {step} of 2
          </span>
          <h2 className="font-serif text-2xl font-black text-foreground">
            Scholar Registration
          </h2>
          <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
            Create an academic profile to draft scientific papers, submit review worksheets, or collaborate.
          </p>
        </div>

        {/* Global Error Banner */}
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

        {/* Registration Forms */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                  Full Name / Academic Title
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={nameRef}
                    type="text"
                    id="reg-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Dr. Alexander Fleming"
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? "name-error" : undefined}
                    className={`w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-650 transition-all ${fieldErrors.name ? 'border-danger focus:border-danger' : 'border-border dark:border-zinc-800/80 focus:border-accent-gold dark:focus:border-accent-gold'}`}
                  />
                  <UserIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-600 absolute left-3" />
                </div>
                {fieldErrors.name && (
                  <span id="name-error" className="text-[10px] text-danger font-bold mt-1 block">
                    {Array.isArray(fieldErrors.name) ? fieldErrors.name[0] : fieldErrors.name}
                  </span>
                )}
              </div>

              {/* Institution */}
              <div className="space-y-1.5">
                <label htmlFor="reg-university" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                  University / Affiliation
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={universityRef}
                    type="text"
                    id="reg-university"
                    value={universityName}
                    onChange={(e) => {
                      setUniversityName(e.target.value);
                      if (fieldErrors.university_name) setFieldErrors(prev => ({ ...prev, university_name: '' }));
                    }}
                    placeholder="Harvard University"
                    required
                    aria-invalid={!!fieldErrors.university_name}
                    aria-describedby={fieldErrors.university_name ? "university-error" : undefined}
                    className={`w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-650 transition-all ${fieldErrors.university_name ? 'border-danger focus:border-danger' : 'border-border dark:border-zinc-800/80 focus:border-accent-gold dark:focus:border-accent-gold'}`}
                  />
                  <School className="w-4 h-4 text-zinc-400 dark:text-zinc-600 absolute left-3" />
                </div>
                {fieldErrors.university_name && (
                  <span id="university-error" className="text-[10px] text-danger font-bold mt-1 block">
                    {Array.isArray(fieldErrors.university_name) ? fieldErrors.university_name[0] : fieldErrors.university_name}
                  </span>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                  Scholar Email
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={emailRef}
                    type="email"
                    id="reg-email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="fleming@university.edu"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    className={`w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-650 transition-all ${fieldErrors.email ? 'border-danger focus:border-danger' : 'border-border dark:border-zinc-800/80 focus:border-accent-gold dark:focus:border-accent-gold'}`}
                  />
                  <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-600 absolute left-3" />
                </div>
                {fieldErrors.email && (
                  <span id="email-error" className="text-[10px] text-danger font-bold mt-1 block">
                    {Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-950 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Continue to Credentials
                <ArrowRight className="w-4 h-4 ml-1.5 shrink-0" />
              </button>

              {/* Step 1 SSO Option */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border dark:border-zinc-800/80"></div>
                <span className="flex-shrink mx-4 text-[9px] text-muted uppercase tracking-widest font-bold">Or</span>
                <div className="flex-grow border-t border-border dark:border-zinc-800/80"></div>
              </div>

              <div id="googleSignUpDiv" className="w-full min-h-[40px] block"></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-350">
              
              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    id="reg-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                    }}
                    placeholder="Minimum 8 characters"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    className={`w-full text-xs font-semibold pl-9 pr-10 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-655 transition-all ${fieldErrors.password ? 'border-danger focus:border-danger' : 'border-border dark:border-zinc-800/80 focus:border-accent-gold dark:focus:border-accent-gold'}`}
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
                  <span id="password-error" className="text-[10px] text-danger font-bold mt-1 block">
                    {Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : fieldErrors.password}
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="reg-confirm" className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={confirmPasswordRef}
                    type={showConfirmPassword ? "text" : "password"}
                    id="reg-confirm"
                    value={passwordConfirmation}
                    onChange={(e) => {
                      setPasswordConfirmation(e.target.value);
                      if (fieldErrors.passwordConfirmation) setFieldErrors(prev => ({ ...prev, passwordConfirmation: '' }));
                    }}
                    placeholder="Confirm password"
                    aria-invalid={!!fieldErrors.passwordConfirmation}
                    aria-describedby={fieldErrors.passwordConfirmation ? "confirm-error" : undefined}
                    className={`w-full text-xs font-semibold pl-9 pr-10 py-2.5 bg-surface-muted dark:bg-zinc-900/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40 placeholder-zinc-400 dark:placeholder-zinc-655 transition-all ${fieldErrors.passwordConfirmation ? 'border-danger focus:border-danger' : 'border-border dark:border-zinc-800/80 focus:border-accent-gold dark:focus:border-accent-gold'}`}
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
                  <span id="confirm-error" className="text-[10px] text-danger font-bold mt-1 block">
                    {Array.isArray(fieldErrors.passwordConfirmation) ? fieldErrors.passwordConfirmation[0] : fieldErrors.passwordConfirmation}
                  </span>
                )}
              </div>

              {/* Password Complexity Validation Checklist */}
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

              {/* Newsletter subscription */}
              <div className="flex items-start space-x-2.5 pt-1 pb-2">
                <input
                  type="checkbox"
                  id="subscribeNewsletter"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-border dark:border-zinc-800 bg-surface dark:bg-zinc-950 text-accent dark:text-accent-gold focus:ring-accent-gold cursor-pointer mt-0.5"
                />
                <label htmlFor="subscribeNewsletter" className="text-xs font-semibold text-muted cursor-pointer select-none leading-tight">
                  I wish to subscribe to academic announcements and magazine issue release alerts.
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 text-xs font-bold uppercase tracking-wider border border-border dark:border-zinc-800 text-foreground py-2.5 rounded-xl hover:bg-surface-muted dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-accent dark:bg-accent-gold hover:opacity-90 text-white dark:text-zinc-955 py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Profile'
                  )}
                </button>
              </div>
            </div>
          )}

        </form>

        {/* Redirect Footer */}
        <div className="text-center pt-4 border-t border-border dark:border-zinc-800/40">
          <p className="text-[11px] font-semibold text-muted">
            Already have an academic profile?{' '}
            <Link
              href="/login"
              className="text-accent dark:text-accent-gold hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
