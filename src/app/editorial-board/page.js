'use client';

import React, { useState, useEffect } from 'react';
import PageBanner from '../../components/PageBanner';
import api from '../../utils/api';
import { Loader2 } from 'lucide-react';

export default function EditorialBoardPage() {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/cms/editorial-board')
      .then(res => {
        if (active && res.data) {
          setCmsData(res.data);
          if (res.data.content_html) {
            // Import and run DOMPurify on the client side only to avoid SSR window errors.
            import('dompurify').then((DOMPurify) => {
              if (active) {
                setSanitizedHtml(DOMPurify.default.sanitize(res.data.content_html));
              }
            });
          }
        }
      })
      .catch(err => {
        console.warn('Failed to fetch editorial-board data:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const dynamicTitle = cmsData?.title || 'Editorial Board';

  return (
    <div className="bg-[var(--background)] min-h-screen transition-premium">
      <title>{`${dynamicTitle} - ScholarlyNest`}</title>
      <PageBanner 
        title={dynamicTitle} 
        description="Meet the distinguished international scholars and peer reviewers steering ScholarlyNest's academic standards."
        customLabels={{ 'editorial-board': 'Editorial Board' }}
      />
      
      <div className="flex-grow flex flex-col space-y-12 max-w-6xl mx-auto w-full pb-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-10 text-zinc-700 dark:text-zinc-300 font-medium">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
              <span className="mt-3 text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                Retrieving Editorial Board...
              </span>
            </div>
          ) : sanitizedHtml ? (
            <div 
              className="prose dark:prose-invert max-w-none font-sans text-zinc-800 dark:text-zinc-200"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
            />
          ) : (
            <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-zinc-500 dark:text-zinc-400">
                Editorial Board details are temporarily unavailable.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
