'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Check, KeyRound, Loader2, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import api from '../../utils/api';
import { safeApiMessage } from '../../utils/safeErrors';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { resolveDashboardRedirect } from '../../utils/authRedirect';

const labels = { email: 'Email Code', totp: 'Authenticator App', recovery_code: 'Recovery Code' };

function VerifyMfaForm() {
  const { loginWithPayload } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorRef = useRef(null);
  const [challenge, setChallenge] = useState(null);
  const [method, setMethod] = useState('totp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('mfa_challenge') || 'null');
      if (!stored?.token || !Array.isArray(stored.requiredMethods || stored.methods)) {
        router.replace('/login');
        return;
      }
      const normalized = {
        ...stored,
        requiredMethods: stored.requiredMethods || stored.methods,
        verifiedMethods: stored.verifiedMethods || [],
        remainingMethods: stored.remainingMethods || stored.requiredMethods || stored.methods,
        nextMethod: stored.nextMethod || stored.defaultMethod || stored.methods[0],
        recoveryCodeAllowed: Boolean(stored.recoveryCodeAllowed),
      };
      setChallenge(normalized);
      setMethod(normalized.nextMethod);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const updateChallenge = (data) => {
    const next = {
      ...challenge,
      requiredMethods: data.required_methods || challenge.requiredMethods,
      verifiedMethods: data.verified_methods || challenge.verifiedMethods,
      remainingMethods: data.remaining_methods || challenge.remainingMethods,
      nextMethod: data.next_method ?? challenge.nextMethod,
      recoveryCodeAllowed: Boolean(data.recovery_code_allowed),
    };
    setChallenge(next);
    sessionStorage.setItem('mfa_challenge', JSON.stringify(next));
    return next;
  };

  const switchRecoveryMode = (next) => {
    setError('');
    setCode('');
    setMethod(next);
  };

  const resend = async () => {
    try {
      setLoading(true);
      await api.post('/auth/mfa/email/resend', { challenge_token: challenge.token });
      toast('A new authentication code was sent.', 'success');
    } catch (err) {
      setError(safeApiMessage(err, 'Please wait before requesting another code.'));
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const valid = method === 'recovery_code' ? code.replace(/[^a-z0-9]/gi, '').length === 12 : /^\d{6}$/.test(code);
    if (!valid) {
      setError(method === 'recovery_code' ? 'Enter a complete recovery code.' : 'Enter a 6-digit authentication code.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/auth/mfa/verify', {
        challenge_token: challenge.token,
        method,
        code,
      });
      if (response.status === 202 || response.data.requires_mfa) {
        const next = updateChallenge(response.data);
        setMethod(next.nextMethod);
        setCode('');
        toast('Verification step complete. Continue with the next required method.', 'success');
        return;
      }
      sessionStorage.removeItem('mfa_challenge');
      loginWithPayload(response.data.user, response.data.access_token);
      toast('Identity verified. Welcome back!', 'success');
      router.replace(resolveDashboardRedirect(searchParams.get('redirect'), response.data.user));
    } catch (err) {
      if (err.response?.data) {
        updateChallenge(err.response.data);
      }
      const message = safeApiMessage(err, 'The authentication code is invalid or expired.');
      setError(message);
      setTimeout(() => errorRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  if (!challenge) return <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  const requiredMethods = challenge.requiredMethods;
  const verifiedMethods = challenge.verifiedMethods;
  const currentStep = Math.min(verifiedMethods.length + 1, requiredMethods.length);
  const Icon = method === 'email' ? Mail : method === 'totp' ? Smartphone : KeyRound;

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-surface p-8 shadow-md dark:bg-[#121316]">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent/10 bg-accent/5 text-accent"><ShieldCheck className="h-6 w-6" /></div>
        <h1 className="font-serif text-2xl font-black text-foreground">Verify your identity</h1>
        <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Step {currentStep} of {requiredMethods.length}</p>
        <p className="text-xs leading-relaxed text-muted">
          {method === 'email' ? 'Enter the 6-digit code sent to your email.' : method === 'totp' ? 'Enter the 6-digit code from your authenticator app.' : 'Enter one of your unused recovery codes.'}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-surface-muted p-3" aria-label="Required verification progress">
        {requiredMethods.map((item) => {
          const complete = verifiedMethods.includes(item);
          return <div key={item} className={`flex items-center gap-2 text-xs font-semibold ${complete ? 'text-emerald-600' : item === challenge.nextMethod ? 'text-foreground' : 'text-muted'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${complete ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border'}`}>{complete ? <Check className="h-3 w-3" /> : '○'}</span>
            {labels[item]}
          </div>;
        })}
      </div>

      {error && <div ref={errorRef} tabIndex="-1" aria-live="assertive" className="flex gap-2 rounded-xl border border-danger/25 bg-danger/5 p-3 text-xs text-danger"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted" htmlFor="mfa-code">{labels[method]}</label>
        <div className="relative">
          <Icon className="absolute left-3 top-3 h-4 w-4 text-muted" />
          <input id="mfa-code" autoComplete="one-time-code" inputMode={method === 'recovery_code' ? 'text' : 'numeric'} maxLength={method === 'recovery_code' ? 14 : 6} value={code} onChange={(event) => setCode(method === 'recovery_code' ? event.target.value.toUpperCase() : event.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pl-10 pr-3 font-mono text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-accent-gold/40" />
        </div>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-accent py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-accent-gold dark:text-zinc-950">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Sign In'}</button>
      </form>

      {challenge.nextMethod === 'totp' && challenge.recoveryCodeAllowed && (
        <button type="button" onClick={() => switchRecoveryMode(method === 'recovery_code' ? 'totp' : 'recovery_code')} disabled={loading} className="w-full text-center text-xs font-semibold text-accent hover:underline">
          {method === 'recovery_code' ? 'Use authenticator code' : 'Use a recovery code'}
        </button>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4 text-[11px] font-semibold">
        {method === 'email' ? <button type="button" onClick={resend} disabled={loading} className="text-accent hover:underline">Resend email code</button> : <span />}
        <Link href="/login" onClick={() => sessionStorage.removeItem('mfa_challenge')} className="text-muted hover:underline">Back to login</Link>
      </div>
    </div>
  );
}

export default function VerifyMfa() {
  return <div className="mx-auto flex w-full max-w-md flex-grow flex-col justify-center px-4 py-12 sm:px-6"><Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin" />}><VerifyMfaForm /></Suspense></div>;
}
