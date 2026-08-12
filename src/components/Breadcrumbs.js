'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ customLabels = {} }) => {
  const pathname = usePathname();
  
  if (pathname === '/' || !pathname) {
    return null;
  }

  const paths = pathname.split('/').filter(Boolean);

  const formatLabel = (segment) => {
    if (customLabels[segment]) {
      return customLabels[segment];
    }
    // Replace hyphens/underscores with spaces and capitalize
    return segment
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <nav aria-label="Breadcrumb" className="py-4 mb-6 border-b border-zinc-100 dark:border-zinc-800/60">
      <ol className="flex items-center space-x-2 text-xs font-medium tracking-wide uppercase text-zinc-400 dark:text-zinc-500">
        <li>
          <Link 
            href="/" 
            className="flex items-center hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </Link>
        </li>
        
        {paths.map((segment, index) => {
          const href = `/${paths.slice(0, index + 1).join('/')}`;
          const isLast = index === paths.length - 1;
          const label = formatLabel(segment);

          return (
            <li key={href} className="flex items-center space-x-2">
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />
              {isLast ? (
                <span className="text-zinc-600 dark:text-zinc-400 font-semibold truncate max-w-[200px] md:max-w-xs">
                  {label}
                </span>
              ) : (
                <Link 
                  href={href}
                  className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
