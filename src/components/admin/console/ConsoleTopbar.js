'use client';

import React from 'react';
import { Menu, Monitor, Moon, Sun } from 'lucide-react';
import ConsoleBreadcrumbs from './ConsoleBreadcrumbs';
import ConsoleUserMenu from './ConsoleUserMenu';
import NotificationBell from '../../notifications/NotificationBell';

export default function ConsoleTopbar({
  user,
  pathname,
  navigation,
  onOpenMobileNav,
  mobileButtonRef,
  theme,
  onThemeChange,
  onLogout,
  impersonationStatus,
  onStopImpersonation,
  stoppingImpersonation,
}) {
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const themeLabel = `Switch color theme. Current theme: ${theme}`;

  return (
    <header className="sticky top-0 z-30 flex min-h-[var(--console-topbar-height)] items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--console-topbar-bg)] px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          ref={mobileButtonRef}
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] lg:hidden"
          aria-label="Open console navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <ConsoleBreadcrumbs pathname={pathname} navigation={navigation} />
        <span className="truncate text-sm font-bold text-[var(--foreground)] sm:hidden">Console</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onThemeChange(nextTheme)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          aria-label={themeLabel}
          title={themeLabel}
        >
          <ThemeIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        <NotificationBell />
        <ConsoleUserMenu
          user={user}
          onLogout={onLogout}
          impersonationActive={impersonationStatus?.active}
          onStopImpersonation={onStopImpersonation}
          stoppingImpersonation={stoppingImpersonation}
        />
      </div>
    </header>
  );
}
