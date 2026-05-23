'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MailOpen, CheckCircle, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../../utils/api';

export default function UnsubscribePage() {
  const params = useParams();
  const router = useRouter();
  const token = params ? params.token : null;

  const [status, setStatus] = useState('confirm'); // 'confirm' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Unsubscribe token is missing.');
      return;
    }

    setStatus('loading');

    try {
      await api.get(`/newsletter/unsubscribe/${token}`);
      setStatus('success');
    } catch (error) {
      console.error('Unsubscribe error:', error);
      const msg = error.response?.data?.message || 'The unsubscribe link is invalid or has expired.';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="flex-grow flex flex-col justify-center items-center py-20 px-4 sm:px-6">
      <title>Manage Subscription - ScholarlyNest</title>
      
      <div className="max-w-md w-full bg-white dark:bg-[#1c1c1b] border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-8 shadow-sm space-y-6 text-center transition-all duration-300">
        
        {status === 'confirm' && (
          <div className="space-y-6">
            <div className="mx-auto w-14 h-14 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-850 rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <MailOpen className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                Manage Subscription
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
                It is hard to see you go... Are you sure you want to unsubscribe from the ScholarlyNest newsletter?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 text-xs font-bold uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 py-3 rounded-lg transition-premium cursor-pointer"
              >
                No, Keep Subscribed
              </button>
              <button
                onClick={handleUnsubscribe}
                className="flex-1 text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-premium cursor-pointer"
              >
                Yes, Unsubscribe
              </button>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)] mx-auto" />
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest font-mono">
              Processing unsubscribe request...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mx-auto w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-255/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-450">
              <CheckCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                Unsubscribed Successfully
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
                You have been successfully removed from our mailing list. You will no longer receive newsletter announcements from ScholarlyNest.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-black text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 px-6 py-3 rounded-lg transition-premium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to ScholarlyFeed</span>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mx-auto w-14 h-14 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-full flex items-center justify-center text-red-650 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                An Error Occurred
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
                {errorMessage || 'The unsubscribe link is invalid or has expired.'}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-black text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 px-6 py-3 rounded-lg transition-premium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to ScholarlyFeed</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
