'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageBanner from '../../components/PageBanner';
import api from '../../utils/api';

export default function TermsOfService() {
  const [dynamicHtml, setDynamicHtml] = useState(null);
  const [dynamicTitle, setDynamicTitle] = useState('Terms of Service');

  useEffect(() => {
    let active = true;
    api.get('/cms/terms')
      .then(res => {
        if (active && res.data && res.data.content_html) {
          setDynamicHtml(res.data.content_html);
          if (res.data.title) {
            setDynamicTitle(res.data.title);
          }
        }
      })
      .catch(err => {
        console.warn('CMS terms dynamic load fallback used:', err.message);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="bg-[var(--background)] min-height-screen transition-premium">
      <title>{dynamicTitle}  - ScholarlyNest</title>
      <PageBanner 
        title={dynamicTitle} 
        description="Effective as of May 17, 2026. These terms govern your access to the ScholarlyNest publishing portal and all related content registries."
        customLabels={{ terms: 'Terms of Service' }}
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
        
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-white flex items-center">
            <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[10px] mr-3 text-zinc-500 font-mono">01</span>
            Acceptance of Publishing Terms
          </h2>
          <div className="pl-9 space-y-4 text-sm leading-relaxed">
            <p>
              By accessing the ScholarlyNest portal, uploading blog drafts, or participating in the editorial review pipeline, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our editorial services.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-white flex items-center">
            <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[10px] mr-3 text-zinc-500 font-mono">02</span>
            Intellectual Property & Open Access Licensing
          </h2>
          <div className="pl-9 space-y-4 text-sm leading-relaxed">
            <p>
              ScholarlyNest adheres to strict open-access principles. All finalized blog articles published on the platform are released under the Creative Commons Attribution 4.0 International License (CC BY 4.0).
            </p>
            <p>
              Authors retain original copyright to their submitted text, graphical abstracts, and multimedia. However, by publishing through our portal, you grant ScholarlyNest a non-exclusive, irrevocable license to host, format, globally distribute, and index the content in academic search engines.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-white flex items-center">
            <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[10px] mr-3 text-zinc-500 font-mono">03</span>
            Editorial Standards & Community Guidelines
          </h2>
          <div className="pl-9 space-y-4 text-sm leading-relaxed">
            <p>
              We prioritize academic integrity. Authors are strictly prohibited from submitting plagiarized materials, manipulated datasets, or articles previously published in indexed journals without explicit acknowledgment. Our editorial board reserves the right to reject or retract any content that violates these guidelines.
            </p>
            <p>
              All users allocated through our permissions system must participate without abusive behaviors or spam. Commenters and writers agree to maintain clean, constructive dialogues. Exploiting platform resources for unsolicited advertisements is strictly prohibited.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-zinc-900 dark:text-white flex items-center">
            <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[10px] mr-3 text-zinc-500 font-mono">04</span>
            Data Storage & Liability Limitations
          </h2>
          <div className="pl-9 space-y-4 text-sm leading-relaxed">
            <p>
              While we utilize enterprise-grade secure cloud pipelines to protect drafts and attachments, ScholarlyNest is not liable for data loss during transmission. Authors are encouraged to maintain local copies of their raw data.
            </p>
          </div>
        </section>
          </>
        )}
      </div>

      </div>

    </div>
  );
}
