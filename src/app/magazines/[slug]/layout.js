'use client';

import React, { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, BookOpen, ChevronRight, FileText, Info, Loader2 } from 'lucide-react';
import api from '../../../utils/api';
import { logError } from '../../../utils/safeLogger';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  if (path.startsWith('/images/') || path.startsWith('images/')) return path.startsWith('/') ? path : '/' + path;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${domain}${cleanPath}`;
};

export default function MagazinePublicLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const slug = params?.slug;
  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const fetchShell = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/magazines/${slug}`);
        setMagazine(response.data);
      } catch (err) {
        logError('Failed to load magazine shell', err);
        setError('The requested magazine could not be found.');
      } finally {
        setLoading(false);
      }
    };

    fetchShell();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-zinc-50/50 dark:bg-zinc-950/40">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-sans font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider">Loading Scientific Catalog...</span>
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

  const navItems = [
    { href: `/magazines/${slug}/about-and-overview`, label: 'About & Overview', icon: Info },
    { href: `/magazines/${slug}/table-of-contents`, label: 'Table of Contents', icon: FileText },
    ...(magazine.pages || []).map((page) => ({
      href: `/magazines/${slug}/${page.slug}`,
      label: page.title,
      icon: BookOpen,
    })),
  ];

  return (
    <div className="min-h-screen bg-zinc-50/30 dark:bg-zinc-950/20 pb-24 font-sans text-left">
      <div className="relative border-b border-zinc-100 dark:border-zinc-900/60 bg-zinc-900 overflow-hidden">
        {magazine.cover_image && (
          <div className="absolute inset-0 bg-cover bg-center scale-105 blur-lg opacity-20 pointer-events-none" style={{ backgroundImage: `url(${getFullImageUrl(magazine.cover_image)})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/90 to-zinc-950/60" />
        <div className="relative w-full px-4 sm:px-6 lg:px-8 pt-40 pb-16 flex flex-col md:flex-row items-center md:items-end justify-between gap-10">
          <div className="space-y-4 text-center md:text-left max-w-3xl">
            <Link href="/magazines" className="inline-flex items-center space-x-1.5 text-[9px] font-sans font-bold uppercase tracking-wider text-amber-500 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Registry Catalog</span>
            </Link>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">{magazine.title}</h1>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-2xl">{magazine.description}</p>
          </div>
          {magazine.cover_image && (
            <div className="shrink-0 w-32 h-44 rounded-xl overflow-hidden border border-white/10 shadow-2xl hidden md:block transform hover:scale-[1.02] transition-transform duration-300">
              <img src={getFullImageUrl(magazine.cover_image)} alt={magazine.title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
            <nav className="bg-white/80 dark:bg-zinc-900/30 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-850 rounded-2xl p-4 space-y-2 shadow-sm" aria-label="Magazine sections">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-3 block mb-2 font-mono">Magazine Directory</span>
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <React.Fragment key={item.href}>
                    {index === 2 && <div className="h-px bg-zinc-100 dark:bg-zinc-850 my-2" />}
                    {index === 2 && <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-3 block mb-1 font-mono">Resource Files</span>}
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        active
                          ? 'bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-500/10'
                          : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    </Link>
                  </React.Fragment>
                );
              })}
            </nav>
          </aside>

          <main className="lg:col-span-8">
            <div className="p-2 sm:p-4 space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
