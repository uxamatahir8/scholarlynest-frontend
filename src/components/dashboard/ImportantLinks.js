'use client';

import React from 'react';
import { BookOpen, Scale, Clock, Mail, Server, Database, Activity, BarChart3, ExternalLink } from 'lucide-react';

export default function ImportantLinks({ isAdmin }) {
  const authorLinks = [
    {
      title: 'Author Guidelines PDF',
      description: 'Download the formatting guidelines, citation rules, and templates.',
      href: '/docs/author-guidelines.pdf',
      icon: <BookOpen className="w-4 h-4 text-zinc-500" />,
      external: true
    },
    {
      title: 'Editorial Submission Policies',
      description: 'Review our open-access peer review rules, ethics guidelines, and terms.',
      href: '/docs/editorial-policies',
      icon: <Scale className="w-4 h-4 text-zinc-500" />,
      external: false
    },
    {
      title: 'Peer Review Timeline Documentation',
      description: 'Understand review phases, scorecard scopes, and revision cycles.',
      href: '/docs/review-timeline',
      icon: <Clock className="w-4 h-4 text-zinc-500" />,
      external: false
    },
    {
      title: 'Contact Editor-in-Chief',
      description: 'Direct email channel for processing status updates and issues.',
      href: 'mailto:editor@scholarlynest.com',
      icon: <Mail className="w-4 h-4 text-zinc-500" />,
      external: true
    }
  ];

  const adminLinks = [
    {
      title: 'Database Backups Panel',
      description: 'Manage MySQL dump files, recovery schedules, and storage status.',
      href: '/admin/settings?tab=backups',
      icon: <Database className="w-4 h-4 text-zinc-500" />,
      external: false
    },
    {
      title: 'System Error Log Monitor',
      description: 'View real-time error occurrences, debug jobs, and webhook logs.',
      href: '/admin/settings?tab=logs',
      icon: <Activity className="w-4 h-4 text-zinc-500" />,
      external: false
    },
    {
      title: 'Global Analytics Overview',
      description: 'Platform telemetry, impressions metrics, and user analytics.',
      href: '/admin',
      icon: <BarChart3 className="w-4 h-4 text-zinc-500" />,
      external: false
    }
  ];

  const links = isAdmin ? adminLinks : authorLinks;

  return (
    <div className="space-y-4 font-sans text-left">
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
        Resources & Links
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {links.map((link, index) => {
          const isEmail = link.href.startsWith('mailto:');
          const targetProps = (link.external || isEmail)
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {};

          return (
            <a
              key={index}
              href={link.href}
              {...targetProps}
              className="group flex items-start space-x-4 p-4 border border-zinc-200/60 dark:border-zinc-850 bg-white/50 dark:bg-zinc-900/5 hover:bg-amber-500/[0.01] hover:border-amber-500/30 dark:hover:border-amber-550/20 rounded-xl transition-all duration-300 shadow-sm cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-850/80 text-zinc-600 dark:text-zinc-400 shrink-0 group-hover:bg-amber-500/10 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {link.icon}
              </div>
              <div className="space-y-1 min-w-0 flex-grow">
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {link.title}
                  </h4>
                  {(link.external || isEmail) && (
                    <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                  )}
                </div>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed font-medium">
                  {link.description}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
