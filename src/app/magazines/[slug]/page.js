'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, FileText, Info, ArrowLeft, Loader2, AlertCircle, 
  ChevronRight, Calendar, User, ArrowRight, ExternalLink 
} from 'lucide-react';
import api from '../../../utils/api';
import TableOfContents from '../../../components/magazine/TableOfContents';
import SeoHead from '../../../components/SeoHead';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/images/') || path.startsWith('images/')) {
    return path.startsWith('/') ? path : '/' + path;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${domain}${cleanPath}`;
};

export default function MagazineShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params ? params.slug : null;

  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active section in the layout: 'about' | 'articles' | 'page_[slug]'
  const [activeSection, setActiveSection] = useState('about');
  const [activePageContent, setActivePageContent] = useState(null);

  // Fetch magazine shell metadata and custom sub-pages
  useEffect(() => {
    if (!slug) return;

    const fetchMagazineData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch magazine details
        const response = await api.get(`/magazines/${slug}`);
        setMagazine(response.data);

      } catch (err) {
        console.error('Failed to load magazine details', err);
        setError('The requested magazine catalog or articles could not be found.');
      } finally {
        setLoading(false);
      }
    };

    fetchMagazineData();
  }, [slug]);

  // Helper to change sections cleanly
  const selectSection = (sectionId, pageObj = null) => {
    setActiveSection(sectionId);
    if (pageObj) {
      setActivePageContent(pageObj);
    } else {
      setActivePageContent(null);
    }
  };

  const handleTrackClick = async (articleId) => {
    try {
      await api.post(`/articles/${articleId}/click`);
    } catch (err) {
      console.error('Failed to track click', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-zinc-50/50 dark:bg-zinc-950/40">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-sans font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider">
          Loading Scientific Catalog...
        </span>
      </div>
    );
  }

  if (error || !magazine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
          <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">Catalog Retrieval Error</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{error || 'Magazine could not be resolved.'}</p>
          <Link href="/magazines" className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-450 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Registry</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/30 dark:bg-zinc-950/20 pb-24 font-sans text-left">
      <SeoHead 
        title={magazine.seo_title}
        description={magazine.seo_description}
        keywords={magazine.seo_keywords}
        ogImage={magazine.og_image}
        ogUrl={`/magazines/${slug}`}
      />

      {/* Hero Showcase Section */}
      <div className="relative border-b border-zinc-100 dark:border-zinc-900/60 bg-zinc-900 overflow-hidden">
        {/* Blurry cover backdrop */}
        {magazine.cover_image && (
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105 blur-lg opacity-20 pointer-events-none"
            style={{ backgroundImage: `url(${getFullImageUrl(magazine.cover_image)})` }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/90 to-zinc-950/60" />

        {/* Hero Content Container */}
        <div className="relative w-full px-4 sm:px-6 lg:px-8 pt-40 pb-16 flex flex-col md:flex-row items-center md:items-end justify-between gap-10">
          {/* Metadata details */}
          <div className="space-y-4 text-center md:text-left max-w-3xl">
            <Link 
              href="/magazines" 
              className="inline-flex items-center space-x-1.5 text-[9px] font-sans font-bold uppercase tracking-wider text-amber-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Registry Catalog</span>
            </Link>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              {magazine.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-2xl">
              {magazine.description}
            </p>
          </div>

          {/* Visual Cover Preview */}
          {magazine.cover_image && (
            <div className="shrink-0 w-32 h-44 rounded-xl overflow-hidden border border-white/10 shadow-2xl hidden md:block transform hover:scale-[1.02] transition-transform duration-300">
              <img 
                src={getFullImageUrl(magazine.cover_image)} 
                alt={magazine.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Sticky Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/30 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-850 rounded-2xl p-4 space-y-2 shadow-sm">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-3 block mb-2 font-mono">
                Magazine Directory
              </span>

              {/* Sidebar Tabs */}
              <button
                onClick={() => selectSection('about')}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSection === 'about'
                    ? 'bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-500/10'
                    : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>About & Overview</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => selectSection('articles')}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSection === 'articles'
                    ? 'bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-500/10'
                    : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Table of Contents</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* Custom resource pages list */}
              {magazine.pages && magazine.pages.length > 0 && (
                <>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-850 my-2" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-3 block mb-1 font-mono">
                    Resource Files
                  </span>
                  {magazine.pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => selectSection(`page_${page.slug}`, page)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeSection === `page_${page.slug}`
                          ? 'bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-500/10'
                          : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <BookOpen className="w-4 h-4 shrink-0 text-amber-500" />
                        <span className="truncate">{page.title}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
                </>
              )}
            </div>
          </aside>

          {/* Core Content Space */}
          <main className="lg:col-span-8">
            <div className="p-2 sm:p-4 space-y-6">
              
              {/* Overview Synopsis */}
              {activeSection === 'about' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-100 dark:border-zinc-900/80 pb-4">
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                      About the Magazine
                    </h2>
                  </div>
                  <div 
                    className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed prose dark:prose-invert max-w-none font-serif tracking-normal"
                    dangerouslySetInnerHTML={{ __html: magazine.about_text || 'No comprehensive overview description has been drafted for this publication.' }}
                  />
                </div>
              )}

              {/* Table of Contents accordion block */}
              {activeSection === 'articles' && (
                <div className="animate-in fade-in duration-300">
                  <TableOfContents
                    groupedArticles={magazine.grouped_articles || {}}
                    coverImage={magazine.cover_image}
                    magazineSlug={slug}
                    onArticleClick={handleTrackClick}
                  />
                </div>
              )}

              {/* Sub-Pages Render */}
              {activeSection.startsWith('page_') && activePageContent && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-100 dark:border-zinc-900/80 pb-4">
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                      {activePageContent.title}
                    </h2>
                  </div>
                  <div 
                    className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed prose dark:prose-invert max-w-none font-serif tracking-normal"
                    dangerouslySetInnerHTML={{ __html: activePageContent.content }}
                  />
                </div>
              )}

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
