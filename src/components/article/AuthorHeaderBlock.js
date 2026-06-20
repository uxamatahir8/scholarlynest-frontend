'use client';

import React from 'react';
import { Mail, User, Award } from 'lucide-react';

export default function AuthorHeaderBlock({ article, authorMetrics }) {
  if (!article) return null;

  const primaryAuthor = article.user || { name: 'Corresponding Author', email: '' };
  const coAuthors = article.article_authors || [];

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-zinc-650 dark:text-zinc-405 font-sans text-left">
      
      {/* Primary Author with Hover Card */}
      <span className="inline-block relative group">
        <span className="font-bold text-zinc-850 dark:text-zinc-100 border-b border-dashed border-zinc-200 dark:border-zinc-800 hover:border-amber-550 dark:hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-help transition-all pb-0.5">
          {primaryAuthor.name}
        </span>
        
        {/* Floating details overlay */}
        <div className="absolute bottom-full left-0 mb-3 w-64 p-5 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-805 rounded-2xl shadow-xl opacity-0 translate-y-1.5 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50 text-xs text-zinc-650 dark:text-zinc-350 space-y-3.5 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/10 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-left font-sans">
              <h4 className="font-bold text-zinc-900 dark:text-white leading-none">{primaryAuthor.name}</h4>
              <span className="text-[9px] text-amber-600 font-mono font-bold uppercase tracking-wider block mt-1">Primary Author</span>
            </div>
          </div>
          
          {primaryAuthor.email && (
            <a
              href={`mailto:${primaryAuthor.email}`}
              className="flex items-center space-x-2.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 hover:bg-amber-500/[0.02] border border-zinc-100 dark:border-zinc-850 transition-colors font-sans"
            >
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span className="truncate font-semibold text-zinc-600 dark:text-zinc-300">{primaryAuthor.email}</span>
            </a>
          )}
          
          {authorMetrics && (
            <div className="text-[9px] text-zinc-400 font-bold font-mono tracking-wider pt-2 border-t border-zinc-100 dark:border-zinc-850 text-left">
              {authorMetrics.total_papers_approved} APPROVED PUBLICATIONS
            </div>
          )}
        </div>
      </span>

      {/* Co-Authors rendering */}
      {coAuthors.length > 0 && (
        <>
          <span className="text-zinc-400 font-medium">,</span>
          {coAuthors.map((author, index) => (
            <React.Fragment key={author.id || index}>
              <span className="inline-block relative group">
                <span className="font-semibold text-zinc-700 dark:text-zinc-200 border-b border-dashed border-zinc-200 dark:border-zinc-800 hover:border-amber-550 dark:hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-help transition-all pb-0.5">
                  {author.co_author_name}
                </span>

                {/* Floating Card */}
                <div className="absolute bottom-full left-0 mb-3 w-64 p-5 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-805 rounded-2xl shadow-xl opacity-0 translate-y-1.5 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50 text-xs text-zinc-655 dark:text-zinc-350 space-y-3.5 backdrop-blur-md">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-blue-500/[0.04] border border-blue-500/10 text-blue-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-left font-sans">
                      <h4 className="font-bold text-zinc-900 dark:text-white leading-none">{author.co_author_name}</h4>
                      <span className="text-[9px] text-blue-600 font-mono font-bold uppercase tracking-wider block mt-1">
                        {author.can_edit ? 'Co-Author (Editor)' : 'Co-Author'}
                      </span>
                    </div>
                  </div>

                  {author.co_author_email && (
                    <a
                      href={`mailto:${author.co_author_email}`}
                      className="flex items-center space-x-2.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-955 hover:bg-blue-500/[0.02] border border-zinc-100 dark:border-zinc-850 transition-colors font-sans"
                    >
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="truncate font-semibold text-zinc-600 dark:text-zinc-350">{author.co_author_email}</span>
                    </a>
                  )}

                  {author.university_name && (
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium font-sans flex items-center space-x-2">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Affiliation:</span>
                      <span className="truncate font-semibold">{author.university_name}</span>
                    </div>
                  )}
                </div>
              </span>
              {index < coAuthors.length - 1 && <span className="text-zinc-400 font-medium mr-1.5">,</span>}
            </React.Fragment>
          ))}
        </>
      )}

    </div>
  );
}
