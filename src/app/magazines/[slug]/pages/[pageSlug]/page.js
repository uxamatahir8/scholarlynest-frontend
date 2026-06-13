'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, FileText, Info, ArrowLeft, Loader2, AlertCircle, 
  ChevronRight, Calendar, User, ArrowRight
} from 'lucide-react';
import api from '../../../../../utils/api';

export default function MagazineCustomPageShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params ? params.slug : null;
  const pageSlug = params ? params.pageSlug : null;

  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active section in the layout: 'page_[slug]'
  const [activeSection, setActiveSection] = useState('');
  const [activePageContent, setActivePageContent] = useState(null);

  // Fetch magazine shell metadata and custom sub-pages
  useEffect(() => {
    if (!slug) return;

    const fetchMagazineData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch magazine details
        const response = await api.get(`/magazines/${slug}`);
        const magData = response.data;
        setMagazine(magData);

        // 2. Locate the custom page matching pageSlug
        if (magData && magData.pages) {
          const matchedPage = magData.pages.find(p => p.slug === pageSlug);
          if (matchedPage) {
            setActiveSection(`page_${pageSlug}`);
            setActivePageContent(matchedPage);
          } else {
            setError('The requested custom editorial sub-page could not be found.');
          }
        } else {
          setError('No sub-pages exist for this magazine.');
        }

      } catch (err) {
        console.error('Failed to load magazine details', err);
        setError('The requested magazine catalog or sub-pages could not be found.');
      } finally {
        setLoading(false);
      }
    };

    fetchMagazineData();
  }, [slug, pageSlug]);

  // Helper to change sections by routing to their respective paths
  const selectSection = (sectionId, pageObj = null) => {
    if (sectionId === 'about') {
      router.push(`/magazines/${slug}`);
    } else if (sectionId === 'articles') {
      router.push(`/magazines/${slug}?tab=articles`);
    } else if (sectionId.startsWith('page_') && pageObj) {
      router.push(`/magazines/${slug}/pages/${pageObj.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-[var(--background)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest font-mono">
          Loading Page Content...
        </span>
      </div>
    );
  }

  if (error || !magazine || !activePageContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Page Retrieval Error</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{error || 'Page could not be resolved.'}</p>
          <Link href={`/magazines/${slug || ''}`} className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Magazine Shell</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 font-sans text-left">
      <title>{`${activePageContent.title} - ${magazine.title} - ScholarlyNest`}</title>

      {/* 1. IMMERSIVE HERO TOP BANNER WITH BLUR OVERLAY */}
      <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-zinc-950">
        {/* Blurry Backdrop background */}
        {magazine.cover_image && (
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105 blur-md opacity-30 pointer-events-none"
            style={{ backgroundImage: `url(${magazine.cover_image})` }}
          />
        )}
        
        {/* Dark radial overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-black/60" />

        {/* Content container */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
            
            {/* Left: Metadata info */}
            <div className="space-y-3 text-center sm:text-left max-w-3xl">
              <Link 
                href={`/magazines/${slug}`} 
                className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)] hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Magazine Overview</span>
              </Link>
              <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                {magazine.title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-2xl line-clamp-2">
                {magazine.description}
              </p>
            </div>

            {/* Right: Cover visual preview */}
            {magazine.cover_image && (
              <div className="shrink-0 w-32 h-44 rounded-lg overflow-hidden border border-white/20 shadow-2xl hidden md:block">
                <img 
                  src={magazine.cover_image} 
                  alt={magazine.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE GRID (Sidebar + Content Panel) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* STICKY SIDEBAR */}
          <aside className="lg:col-span-4 lg:sticky lg:top-32 space-y-4">
            <div className="glass-panel rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 backdrop-blur p-4 space-y-2 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)] px-3 block mb-2">
                Magazine Directory
              </span>

              {/* Navigation Options */}
              <button
                onClick={() => selectSection('about')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-[var(--foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              >
                <div className="flex items-center space-x-2.5">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>About & Overview</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => selectSection('articles')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-[var(--foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Articles & Submissions</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Dynamic pages ordered by sort_order */}
              {magazine.pages && magazine.pages.length > 0 && (
                <>
                  <div className="h-px bg-zinc-200/80 dark:bg-zinc-800 my-2" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] px-3 block mb-1">
                    Editorial Resource Files
                  </span>
                  {magazine.pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => selectSection(`page_${page.slug}`, page)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeSection === `page_${page.slug}`
                          ? 'bg-[var(--accent)] text-white shadow-sm'
                          : 'text-[var(--foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <BookOpen className="w-4 h-4 shrink-0 text-[var(--accent-gold)]" />
                        <span className="truncate">{page.title}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </>
              )}
            </div>
          </aside>

          {/* DYNAMIC CONTENT SPACE */}
          <main className="lg:col-span-8">
            <div className="glass-panel rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/30 backdrop-blur p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
                  <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                    {activePageContent.title}
                  </h2>
                </div>
                {/* Dynamic HTML Injection */}
                <div 
                  className="text-zinc-650 dark:text-zinc-300 text-sm leading-relaxed prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: activePageContent.content }}
                />
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
