'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, GraduationCap, FileText, Send, Check } from 'lucide-react';
import api from '../../utils/api';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;
    api.get('/public/footer')
      .then((res) => {
        if (active && res.data) {
          setCategories(res.data);
        }
      })
      .catch((err) => {
        console.warn('Dynamic footer fetch failed, using visual fallbacks:', err.message);
      });
    return () => {
      active = false;
    };
  }, []);

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
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900/60 mt-auto py-16 text-left font-sans transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand & Editorial Mission Statement (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="ScholarlyNest Logo" 
                width={690} 
                height={362} 
                className="h-9 w-auto object-contain" 
              />
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-sm">
              Dedicated to advancing human scientific discovery and open-access knowledge sharing. ScholarlyNest provides a prestigious, peer-reviewed registry where authors and readers collaborate.
            </p>
            <div className="flex items-center space-x-3 text-zinc-400 dark:text-zinc-500">
              <GraduationCap className="w-4 h-4 hover:text-amber-500 transition-colors cursor-pointer" />
              <BookOpen className="w-4 h-4 hover:text-amber-500 transition-colors cursor-pointer" />
              <FileText className="w-4 h-4 hover:text-amber-500 transition-colors cursor-pointer" />
            </div>
          </div>

          {/* Dynamic Categories (5 cols split) */}
          <div className="md:col-span-5 grid grid-cols-2 gap-8">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat.id} className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 font-sans">
                    {cat.name}
                  </h3>
                  <ul className="space-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {cat.pages && cat.pages.map((p) => (
                      <li key={p.id}>
                        <Link href={`/${p.slug}`} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors block">
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              /* Static Fallbacks */
              <>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 font-sans">
                    Resources
                  </h3>
                  <ul className="space-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <li>
                      <Link href="/editorial-board" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors block">
                        Editorial Board
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 font-sans">
                    Institutional
                  </h3>
                  <ul className="space-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <li>
                      <Link href="/privacy" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors block">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors block">
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <Link href="/manifests" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors block">
                        Metadata Manifests
                      </Link>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Newsletter (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400 font-sans">
              Newsletter Sign-Up
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Stay synchronized with recent scientific announcements and platform enhancements.
            </p>

            {subscribed ? (
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-500/[0.04] border border-emerald-500/10 px-3.5 py-2.5 rounded-lg transition-all">
                <Check className="w-4 h-4 shrink-0" />
                <span>Affiliation Subscribed</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribeSubmit} className="flex relative w-full">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jsmith@university.edu"
                  className="w-full text-xs font-semibold pl-3 pr-10 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-amber-500/80 transition-colors text-zinc-850 dark:text-zinc-200 shadow-sm"
                />
                <button 
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1.5 bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-md transition-all duration-300 cursor-pointer"
                  aria-label="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Fine-line Typographic Divider & Copyright info */}
        <div className="border-t border-zinc-100 dark:border-zinc-900/60 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          <span>
            © {new Date().getFullYear()} ScholarlyNest Platform Inc. All rights reserved.
          </span>
          <div className="flex space-x-5 mt-4 sm:mt-0">
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
