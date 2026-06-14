'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../utils/api';

export default function TopAnnounceRibbon() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRibbonData = async () => {
      try {
        setLoading(true);
        // Parallel streams ingestion from public endpoints
        const [magRes, newsRes] = await Promise.all([
          api.get('/public/magazines?per_page=3'),
          api.get('/public/newsletters?per_page=3')
        ]);

        const magazines = magRes.data?.data || [];
        const newsletters = newsRes.data?.data || [];

        // Polymorphic normalization
        const normalizedMags = magazines.map(m => ({
          id: `mag-${m.id}`,
          label: 'Latest Issue',
          title: m.title,
          url: `/magazines/${m.slug}`,
          isMagazine: true,
          createdAt: m.created_at || m.updated_at
        }));

        const normalizedNews = newsletters.map(n => ({
          id: `news-${n.id}`,
          label: 'Newsletter',
          title: n.subject,
          url: '#',
          isMagazine: false,
          createdAt: n.created_at || n.sent_at
        }));

        // Combine and sort by date
        const combined = [...normalizedMags, ...normalizedNews].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setItems(combined);
      } catch (err) {
        console.error('Failed to fetch announcement ribbon data:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRibbonData();
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      document.documentElement.classList.add('has-top-ribbon');
    } else {
      document.documentElement.classList.remove('has-top-ribbon');
    }
    return () => {
      document.documentElement.classList.remove('has-top-ribbon');
    };
  }, [items]);

  // Gracefully fallback to null if loading, empty, or failed
  if (loading || items.length === 0) {
    return null;
  }

  // Programmatically duplicate 3 times per block to guarantee continuous flow
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="relative w-full h-9 bg-zinc-950 border-b border-zinc-900 flex items-center overflow-hidden z-40 select-none">
      {/* Pinned static Updates badge */}
      <div className="absolute left-0 top-0 h-full bg-zinc-950 pl-4 pr-3 flex items-center space-x-2 border-r border-zinc-900 z-50">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-slow" />
        <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-zinc-400">
          Updates
        </span>
      </div>

      {/* Marquee Track Container */}
      <div className="w-full flex items-center overflow-hidden pl-24">
        <div className="animate-marquee flex items-center whitespace-nowrap py-1">
          {/* Block 1 */}
          <div className="flex items-center space-x-12 pr-12">
            {duplicatedItems.map((item, index) => (
              <div key={`b1-${item.id}-${index}`} className="flex items-center space-x-3 text-zinc-300">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider ${
                    item.isMagazine
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {item.label}
                </span>
                <Link
                  href={item.url}
                  className="font-serif text-xs tracking-wide hover:text-white transition-colors cursor-pointer"
                >
                  {item.title}
                </Link>
              </div>
            ))}
          </div>

          {/* Block 2 (Duplicate for seamless loop) */}
          <div className="flex items-center space-x-12 pr-12">
            {duplicatedItems.map((item, index) => (
              <div key={`b2-${item.id}-${index}`} className="flex items-center space-x-3 text-zinc-300">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider ${
                    item.isMagazine
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {item.label}
                </span>
                <Link
                  href={item.url}
                  className="font-serif text-xs tracking-wide hover:text-white transition-colors cursor-pointer"
                >
                  {item.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
