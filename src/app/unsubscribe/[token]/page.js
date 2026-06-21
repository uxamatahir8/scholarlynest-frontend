'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MailOpen, CheckCircle, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../../utils/api';
import { logError } from '../../../utils/safeLogger';
import SeoHead from '../../../components/SeoHead';

export default function UnsubscribePage() {
  const params = useParams();
  const router = useRouter();
  const token = params ? params.token : null;

  const [status, setStatus] = useState('confirm'); // 'confirm' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('The unsubscribe link is invalid or has expired.');
      return;
    }

    setStatus('loading');

    try {
      await api.get(`/newsletter/unsubscribe/${token}`);
      setStatus('success');
    } catch (error) {
      logError('Unsubscribe error:', error);
      
      // Safety precaution: Exclude any raw database trace or system exceptions
      let msg = 'The unsubscribe link is invalid or has expired.';
      if (error?.response?.data?.message) {
        const responseMsg = error.response.data.message;
        const containsSqlOrException = 
          responseMsg.includes('SQLSTATE') || 
          responseMsg.includes('database') || 
          responseMsg.includes('Exception') || 
          responseMsg.includes('Stack trace') ||
          responseMsg.includes('QueryException');
        
        if (!containsSqlOrException) {
          msg = responseMsg;
        }
      }
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50/20 dark:bg-zinc-950/10 flex flex-col justify-center items-center py-20 px-4 sm:px-6">
      <SeoHead
        title="Manage Subscription — ScholarlyNest"
        description="Manage your ScholarlyNest email subscription settings."
        ogUrl="/unsubscribe"
      />
      
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900/60 rounded-3xl p-8 shadow-sm space-y-6 text-center transition-all duration-300">
        
        {status === 'confirm' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mx-auto w-14 h-14 bg-amber-500/5 border border-amber-500/10 rounded-full flex items-center justify-center text-amber-600">
              <MailOpen className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                Manage Subscription
              </h2>
              <p className="text-xs text-zinc-505 dark:text-zinc-400 leading-relaxed px-2 font-medium">
                Are you sure you want to unsubscribe from the ScholarlyNest newsletter updates? We will miss sending you our latest academic news.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="w-full text-[10px] font-sans font-bold uppercase tracking-wider bg-zinc-105 hover:bg-zinc-150 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-205 py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                No, Keep Subscribed
              </button>
              <button
                onClick={handleUnsubscribe}
                className="w-full text-[10px] font-sans font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                Yes, Unsubscribe
              </button>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="py-12 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-600 mx-auto" />
            <p className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
              Processing Request...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mx-auto w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                Unsubscribed Successfully
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed px-2 font-medium">
                You have been successfully removed from our mailing list. You will no longer receive announcements or newsletter emails.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center space-x-2 text-[10px] font-sans font-bold uppercase tracking-wider bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Homepage</span>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mx-auto w-14 h-14 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/40 rounded-full flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                An Error Occurred
              </h2>
              <p className="text-xs text-zinc-505 dark:text-zinc-405 leading-relaxed px-2 font-medium">
                {errorMessage}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center space-x-2 text-[10px] font-sans font-bold uppercase tracking-wider bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Homepage</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
