'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, GraduationCap, FileText, Send, Check } from 'lucide-react';
import api from '../utils/api';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    if (email.trim()) {
      try {
        await api.post('/newsletter/subscribe', { email });
        setSubscribed(true);
        setTimeout(() => {
          setSubscribed(false);
          setEmail('');
        }, 4000);
      } catch (err) {
        console.error('Failed to subscribe to newsletter:', err);
      }
    }
  };

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800/60 mt-auto py-12 transition-premium">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Core Brand Statement */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <Image src="/logo.png" alt="ScholarlyNest Logo" width={690} height={362} className="h-10 sm:h-12 md:h-18 w-auto object-contain" />
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-xs">
              Dedicated to advancing human scientific discovery and open knowledge sharing. ScholarlyNest provides a trusted, open-access space where researchers and readers collaborate.
            </p>
            <div className="flex items-center space-x-3 text-zinc-400 dark:text-zinc-500">
              <GraduationCap className="w-4 h-4 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors" />
              <BookOpen className="w-4 h-4 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors" />
              <FileText className="w-4 h-4 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">

              <li>
                <Link href="/about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Editorial Board
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Institutional Scope */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-4">
              Institutional
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <li>
                <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Privacy Statement
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/manifests" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Metadata Manifests
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter Subscriber */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Subscribe to Newsletter
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Stay updated with our latest scientific announcements and platform releases.
            </p>

            {subscribed ? (
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3 py-2 rounded-md transition-all">
                <Check className="w-4 h-4 shrink-0" />
                <span>Subscription Confirmed!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribeSubmit} className="flex relative w-full">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jsmith@university.edu"
                  className="w-full text-xs font-medium pl-3 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors"
                />
                <button 
                  type="submit"
                  className="absolute right-1 top-1 p-1.5 bg-zinc-900 hover:bg-zinc-950 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-950 rounded-md transition-premium"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Bottom Metadata & Copyright row */}
        <div className="border-t border-zinc-200/60 dark:border-zinc-800/40 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
          <span>
            © {new Date().getFullYear()} ScholarlyNest Platform Inc. All rights reserved.
          </span>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Privacy Statement</Link>
            <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/manifests" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Metadata Manifests</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
