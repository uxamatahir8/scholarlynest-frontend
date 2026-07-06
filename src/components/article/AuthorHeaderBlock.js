'use client';

import React from 'react';

export default function AuthorHeaderBlock({ article }) {
  if (!article) return null;

  const primaryAuthor = article.user || { name: 'Corresponding Author' };
  const coAuthors = article.article_authors || [];

  return (
    <div className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 font-sans space-y-2 text-left">
      {/* Primary Author */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-bold text-zinc-900 dark:text-zinc-100">
          {primaryAuthor.name}
        </span>
        <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded">
          Corresponding Author
        </span>
      </div>

      {/* Co-Authors */}
      {coAuthors.length > 0 && (
        <div className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
          <span className="font-bold uppercase tracking-widest text-[9px] text-zinc-400 dark:text-zinc-550 block mb-1">
            Co-Authors & Affiliations
          </span>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {coAuthors.map((author, index) => {
              const affiliation = author.university_name || author.affiliation;
              return (
                <span key={author.id || index} className="inline-flex items-center">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {author.co_author_name}
                  </span>
                  {affiliation && (
                    <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                      ({affiliation})
                    </span>
                  )}
                  {index < coAuthors.length - 1 && <span className="text-zinc-300 dark:text-zinc-700 ml-2 select-none">|</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
