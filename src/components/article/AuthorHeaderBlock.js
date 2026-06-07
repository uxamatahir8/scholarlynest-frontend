'use client';

import React from 'react';
import { Mail, Shield, User, Award } from 'lucide-react';

export default function AuthorHeaderBlock({ article, authorMetrics }) {
  if (!article) return null;

  const primaryAuthor = article.user || { name: 'Corresponding Author', email: '' };
  const coAuthors = article.article_authors || [];

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-700 dark:text-zinc-300">
      
      {/* Primary Author (Grouped with hover card) */}
      <span className="inline-block relative group">
        <span className="font-bold text-zinc-950 dark:text-white border-b border-dashed border-zinc-400 hover:border-zinc-800 dark:hover:border-zinc-200 cursor-help transition-colors pb-0.5">
          {primaryAuthor.name}
        </span>
        
        {/* Floating Card */}
        <div className="absolute bottom-full left-0 mb-2 w-64 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50 text-xs text-zinc-650 dark:text-zinc-300 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white leading-none">{primaryAuthor.name}</h4>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider font-mono">Primary Author</span>
            </div>
          </div>
          
          {primaryAuthor.email && (
            <a
              href={`mailto:${primaryAuthor.email}`}
              className="flex items-center space-x-2 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800/80 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-zinc-450" />
              <span className="truncate font-semibold">{primaryAuthor.email}</span>
            </a>
          )}
          
          {authorMetrics && (
            <div className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium font-mono pt-1">
              • {authorMetrics.total_papers_approved} approved publications
            </div>
          )}
        </div>
      </span>

      {/* Separator and Co-Authors */}
      {coAuthors.length > 0 && (
        <>
          <span className="text-zinc-400 font-medium">,</span>
          {coAuthors.map((author, index) => (
            <React.Fragment key={author.id || index}>
              <span className="inline-block relative group">
                <span className="font-medium text-zinc-850 dark:text-zinc-250 border-b border-dashed border-zinc-300 hover:border-zinc-650 dark:hover:border-zinc-450 cursor-help transition-colors pb-0.5">
                  {author.co_author_name}
                </span>

                {/* Floating Card */}
                <div className="absolute bottom-full left-0 mb-2 w-64 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50 text-xs text-zinc-650 dark:text-zinc-300 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white leading-none">{author.co_author_name}</h4>
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider font-mono">
                        {author.can_edit ? 'Co-Author (Editor)' : 'Co-Author'}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`mailto:${author.co_author_email}`}
                    className="flex items-center space-x-2 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800/80 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-zinc-450" />
                    <span className="truncate font-semibold">{author.co_author_email}</span>
                  </a>

                  <div className="flex items-center space-x-1.5 pt-1 text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold font-mono">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Permissions: {author.can_edit ? 'Edit & Collaborate' : 'View Only'}</span>
                  </div>
                </div>
              </span>
              {index < coAuthors.length - 1 && <span className="text-zinc-400 font-medium mr-1">,</span>}
            </React.Fragment>
          ))}
        </>
      )}

    </div>
  );
}
