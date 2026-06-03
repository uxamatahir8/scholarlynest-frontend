'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, FileText, Info, ArrowLeft, Loader2, AlertCircle, 
  ChevronRight, Calendar, User, ArrowRight, ExternalLink 
} from 'lucide-react';
import api from '../../../utils/api';

export default function MagazineShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params ? params.slug : null;

  const [magazine, setMagazine] = useState(null);
  const [articles, setArticles] = useState([]);
  const [articlesPage, setArticlesPage] = useState(1);
  const [articlesTotalPages, setArticlesTotalPages] = useState(1);
  
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
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
        
        // 1. Fetch magazine details
        const response = await api.get(`/magazines/${slug}`);
        setMagazine(response.data);

        // 2. Fetch magazine approved articles
        const articlesResponse = await api.get(`/magazines/${slug}/articles?page=1`);
        setArticles(articlesResponse.data.data || []);
        setArticlesTotalPages(articlesResponse.data.last_page || 1);

      } catch (err) {
        console.error('Failed to load magazine details', err);
        setError('The requested magazine catalog or articles could not be found.');
      } finally {
        setLoading(false);
      }
    };

    fetchMagazineData();
  }, [slug]);

  // Fetch paginated articles when page changes
  const fetchArticlesPage = async (pageNumber) => {
    try {
      setLoadingArticles(true);
      const response = await api.get(`/magazines/${slug}/articles?page=${pageNumber}`);
      setArticles(response.data.data || []);
      setArticlesPage(pageNumber);
      setArticlesTotalPages(response.data.last_page || 1);
    } catch (err) {
      console.error('Failed to paginate articles', err);
    } finally {
      setLoadingArticles(false);
    }
  };

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
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-[var(--background)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest font-mono">
          Loading Scientific Catalog...
        </span>
      </div>
    );
  }

  if (error || !magazine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Catalog Retrieval Error</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{error || 'Magazine could not be resolved.'}</p>
          <Link href="/magazines" className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Registry</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 font-sans">
      <title>{`${magazine.title}  - ScholarlyNest`}</title>

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
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
            
            {/* Left: Metadata info */}
            <div className="space-y-3 text-center sm:text-left max-w-3xl">
              <Link 
                href="/magazines" 
                className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-gold)] hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Registry Catalog</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSection === 'about'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>About & Overview</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => selectSection('articles')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSection === 'articles'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
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
              
              {/* SECTION 1: ABOUT TEXT */}
              {activeSection === 'about' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                      About the Magazine
                    </h2>
                  </div>
                  <div 
                    className="text-zinc-650 dark:text-zinc-300 text-sm leading-relaxed prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: magazine.about_text || 'No comprehensive overview description has been drafted for this publication.' }}
                  />
                </div>
              )}

              {/* SECTION 2: ARTICLES CATALOGUE */}
              {activeSection === 'articles' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4 flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">
                      Articles Feed
                    </h2>
                  </div>

                  {loadingArticles ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
                    </div>
                  ) : articles.length === 0 ? (
                    <div className="text-center py-20 text-zinc-400">
                      <FileText className="w-12 h-12 mx-auto text-zinc-200 dark:text-zinc-800 mb-3" />
                      <p className="text-sm font-semibold">No approved papers have been cataloged in this issue.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {articles.map((art) => (
                        <div 
                          key={art.id}
                          className="group relative border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/60 p-5 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-premium shadow-sm"
                        >
                          <div className="space-y-3">
                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-[var(--muted)] font-mono uppercase tracking-wider">
                              <span className="flex items-center text-zinc-500">
                                <User className="w-3.5 h-3.5 mr-1" />
                                {art.user?.name}
                              </span>
                              <span>•</span>
                              <span className="flex items-center text-zinc-500">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                {new Date(art.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[var(--accent)] transition-colors leading-snug">
                              <Link 
                                href={`/magazines/${slug}/articles/${art.slug}`} 
                                className="cursor-pointer"
                                onClick={() => handleTrackClick(art.id)}
                              >
                                {art.title}
                              </Link>
                            </h3>

                            {/* Abstract short render */}
                            <div 
                              className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3"
                              dangerouslySetInnerHTML={{ __html: art.abstract }}
                            />

                            {/* Link Trigger */}
                            <div className="pt-2 flex justify-between items-center">
                              {art.pdf_path && (
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                  PDF Archive Loaded
                                </span>
                              )}
                              <Link
                                href={`/magazines/${slug}/articles/${art.slug}`}
                                className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] group-hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                                onClick={() => handleTrackClick(art.id)}
                              >
                                <span>Read Full Paper</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Pagination Controls */}
                      {articlesTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-850">
                          <button
                            onClick={() => fetchArticlesPage(articlesPage - 1)}
                            disabled={articlesPage === 1}
                            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 cursor-pointer"
                          >
                            Previous
                          </button>
                          <span className="text-xs font-mono font-bold text-[var(--muted)]">
                            Page {articlesPage} of {articlesTotalPages}
                          </span>
                          <button
                            onClick={() => fetchArticlesPage(articlesPage + 1)}
                            disabled={articlesPage === articlesTotalPages}
                            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 3: DYNAMIC PAGE CONTENT */}
              {activeSection.startsWith('page_') && activePageContent && (
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
              )}

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
