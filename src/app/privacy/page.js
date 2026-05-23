'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Database, Lock, Eye } from 'lucide-react';
import PageBanner from '../../components/PageBanner';
import api from '../../utils/api';

export default function PrivacyPolicy() {
  const [dynamicHtml, setDynamicHtml] = useState(null);
  const [dynamicTitle, setDynamicTitle] = useState('Data Privacy Protocol');

  useEffect(() => {
    let active = true;
    api.get('/cms/privacy')
      .then(res => {
        if (active && res.data && res.data.content_html) {
          setDynamicHtml(res.data.content_html);
          if (res.data.title) {
            setDynamicTitle(res.data.title);
          }
        }
      })
      .catch(err => {
        console.warn('CMS privacy dynamic load fallback used:', err.message);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="bg-[var(--background)] min-height-screen transition-premium">
      <title>{dynamicTitle}  - ScholarlyNest</title>
      
      <PageBanner 
        title={dynamicTitle} 
        description="ScholarlyNest maintains rigorous standards for user data protection. This protocol outlines how your personal information and academic manuscripts are collected, stored, and utilized across our platform architecture."
        customLabels={{ privacy: 'Privacy Policy' }}
      />

      <div className="flex-grow flex flex-col space-y-12 max-w-6xl mx-auto w-full pb-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="space-y-10 text-zinc-700 dark:text-zinc-300 font-medium">
        {dynamicHtml ? (
          <div 
            className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300"
            dangerouslySetInnerHTML={{ __html: dynamicHtml }}
          />
        ) : (
          <>
        
        {/* Section 1 */}
        <section className="bg-white dark:bg-[#181817] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center">
            <Database className="w-5 h-5 mr-3 text-zinc-400" />
            1. Information Collection
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              When registering as an author, editor, or administrator, we collect standard identity records including your name, institutional email address, and academic credentials.
            </p>
            <p>
              During manuscript submission, draft contents, reference assets, and taxonomy metadata are temporarily cached before final publication. To protect academic integrity during peer review, author identities are decoupled from manuscripts in our editorial dashboard interfaces.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="bg-white dark:bg-[#181817] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-3 text-zinc-400" />
            2. Secure Storage Protocols
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              We implement enterprise security standards. User authentication is secured via modern encrypted hashing algorithms. Multimedia attachments and scientific figures are isolated within secure cloud environments to prevent unauthorized data scraping.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-white dark:bg-[#181817] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-3 text-zinc-400" />
            3. Transparency & Third-Party Indexing
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              To fulfill our mission of Open Access science, published blogs and their associated metadata are intentionally indexed by academic search engines (e.g., Google Scholar) globally. By publishing on ScholarlyNest, you consent to this public distribution.
            </p>
            <p>
              We absolutely do not sell user credential data, email addresses, or un-published drafts to third-party marketing agencies under any circumstances.
            </p>
          </div>
        </section>
          </>
        )}
      </div>

      <div className="pt-8 text-center border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500">
          For data deletion requests or privacy inquiries, please reach out via our <Link href="/contact" className="underline hover:text-zinc-900 dark:hover:text-white">Contact Portal</Link>.
        </p>
      </div>

      </div>

    </div>
  );
}
