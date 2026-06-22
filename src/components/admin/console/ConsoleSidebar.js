'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getRoleDisplayName } from '../../../utils/roles';

function isItemActive(pathname, item) {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function ConsoleNavigationList({ navigation, pathname, onNavigate, compact = false }) {
  return (
    <nav aria-label="Console navigation" className="space-y-7">
      {navigation.map((section) => (
        <section key={section.group} aria-labelledby={`console-nav-${section.group.toLowerCase().replaceAll(' ', '-')}`}>
          {!compact && (
            <h2 id={`console-nav-${section.group.toLowerCase().replaceAll(' ', '-')}`} className="mb-2 px-3 text-xs font-bold text-zinc-500 dark:text-zinc-450">
              {section.group}
            </h2>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => {
              const active = isItemActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                      active
                        ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-850 dark:text-white'
                        : 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-350 dark:hover:bg-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${active ? 'bg-[var(--accent)]' : 'bg-transparent'}`} aria-hidden="true" />
                    {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}

export default function ConsoleSidebar({ user, navigation, pathname }) {
  return (
    <aside className="hidden h-screen w-[var(--console-sidebar-width)] shrink-0 border-r border-[var(--border)] bg-[var(--console-sidebar-bg)] lg:flex lg:flex-col" aria-label="Console sidebar">
      <div className="flex min-h-[var(--console-topbar-height)] items-center border-b border-[var(--border)] px-6">
        <Link href="/admin" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
          <Image src="/logo.png" alt="ScholarlyNest" width={690} height={362} className="h-9 w-auto object-contain" priority />
        </Link>
      </div>

      <div className="border-b border-[var(--border)] px-6 py-5">
        <p className="truncate text-sm font-bold text-[var(--foreground)]">{user?.name || 'Console user'}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{getRoleDisplayName(user)}</p>
      </div>

      <div className="console-scroll flex-1 overflow-y-auto px-3 py-5">
        <ConsoleNavigationList navigation={navigation} pathname={pathname} />
      </div>
    </aside>
  );
}
