'use client';

import React, { useState } from 'react';
import { Mail, Check, Loader2, Send } from 'lucide-react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function NewsletterRibbon() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      const res = await api.post('/newsletter/subscribe', { email });
      setSuccess(true);
      toast(res.data?.message || 'Thank you for subscribing to our newsletter!', 'success');
      setEmail('');
      
      // Auto-clear success visualization state after 4 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Failed to subscribe:', err);
      const errorMsg = err.response?.data?.message || 'An error occurred while registering your email.';
      toast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full bg-zinc-50 dark:bg-zinc-950 border-t border-b border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden py-10 md:py-12 transition-all duration-300">
      {/* Decorative Golden Ambient Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[var(--accent-gold)]/5 to-transparent pointer-events-none rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[var(--accent)]/5 to-transparent pointer-events-none rounded-full blur-3xl" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Content Column */}
          <div className="lg:col-span-7 flex items-start space-x-4">
            <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[var(--accent)] dark:text-[var(--accent-gold)] shadow-inner hidden sm:flex shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 dark:text-white tracking-tight">
                Stay Ahead in Research
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                Join our newsletter to receive the latest academic journals, monthly magazine highlights, and trending scholarly breakthroughs directly in your inbox.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-5 w-full">
            {success ? (
              <div className="flex items-center space-x-2.5 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-1 bg-emerald-500/10 rounded-full">
                  <Check className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Subscription Confirmed</h4>
                  <p className="text-[11px] text-emerald-600/85 dark:text-emerald-500/80 font-medium">Thank you for subscribing! Keep an eye on your inbox.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative flex-grow">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jsmith@university.edu"
                    disabled={loading}
                    className="w-full text-xs font-medium pl-4 pr-4 py-3.5 bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/10 transition-all placeholder-zinc-400 dark:placeholder-zinc-650"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-950 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 hover:scale-[1.02] disabled:scale-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Subscribe</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
