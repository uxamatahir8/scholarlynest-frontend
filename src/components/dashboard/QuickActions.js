'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, Users, UserPlus, BookOpen, ClipboardCheck, LayoutGrid, ArrowRight } from 'lucide-react';
import { articleQueueHref } from '../../utils/articleQueues';

export default function QuickActions({ isAdmin }) {
  const authorActions = [
    {
      title: 'Submit New Manuscript',
      description: 'Start publishing wizard with co-author credentials configuration.',
      href: '/admin/articles/new',
      icon: <Plus className="w-5 h-5" />,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/10'
    },
    {
      title: 'Manage Assets',
      description: 'Upload, replace, and configure supplementary datasets and templates.',
      href: '/admin/articles',
      icon: <FolderOpen className="w-5 h-5" />,
      color: 'text-zinc-700 dark:text-zinc-300 bg-zinc-500/5 border-zinc-500/10'
    },
    {
      title: 'View Co-Authored Papers',
      description: 'Track submissions where you are listed as an active collaborator.',
      href: '/admin/articles',
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-500/5 border-blue-500/10'
    }
  ];

  const adminActions = [
    {
      title: 'Create New User',
      description: 'Provision credentials and roles for staff or academic authors.',
      href: '/admin/rbac',
      icon: <UserPlus className="w-5 h-5" />,
      color: 'text-zinc-700 dark:text-zinc-300 bg-zinc-500/5 border-zinc-500/10'
    },
    {
      title: 'Publish New Issue',
      description: 'Design new digital volumes and configure SEO registries.',
      href: '/admin/magazines',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'text-zinc-700 dark:text-zinc-300 bg-zinc-500/5 border-zinc-500/10'
    },
    {
      title: 'Moderate Manuscripts',
      description: 'Accept, reject, or request revisions for submitted manuscripts.',
      href: articleQueueHref('submitted'),
      icon: <ClipboardCheck className="w-5 h-5" />,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/10'
    },
    {
      title: 'Edit Footer CMS',
      description: 'Update navigation taxonomies, dynamic pages, and legal indices.',
      href: '/admin/footer-cms',
      icon: <LayoutGrid className="w-5 h-5" />,
      color: 'text-zinc-700 dark:text-zinc-300 bg-zinc-500/5 border-zinc-500/10'
    }
  ];

  const actions = isAdmin ? adminActions : authorActions;

  return (
    <div className="space-y-4 font-sans text-left">
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((act, index) => (
          <Link
            key={index}
            href={act.href}
            className="group flex flex-col justify-between p-5 border border-zinc-200/80 dark:border-zinc-850 hover:border-amber-500/40 dark:hover:border-amber-500/30 bg-white/70 dark:bg-zinc-900/10 hover:bg-amber-500/[0.01] rounded-2xl transition-all duration-300 shadow-sm cursor-pointer relative"
          >
            <div className="space-y-3">
              <div className={`p-2 rounded-xl inline-flex items-center justify-center border shrink-0 ${act.color}`}>
                {act.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {act.title}
                </h4>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed font-medium">
                  {act.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors pt-4 mt-auto border-t border-dashed border-zinc-100 dark:border-zinc-850/50">
              <span>Navigate</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
