'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, Monitor, Moon, Search, Settings, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRole, getRoleDisplayName } from '../utils/roles';
import { applyTheme, getStoredTheme, setTheme as persistTheme } from '../utils/theme';
import Dialog from './ui/Dialog';
import RoleBadge from './ui/RoleBadge';
import GlobalSearchInput from './home/GlobalSearchInput';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Magazines', href: '/magazines' },
  { label: 'Contact', href: '/contact' },
];

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const mobileInitialFocusRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setThemeOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const savedTheme = getStoredTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (getStoredTheme() === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const roleLabel = getRoleDisplayName(getPrimaryRole(user));
  const ThemeIcon = THEME_OPTIONS.find((option) => option.value === theme)?.Icon || Sun;

  const setNextTheme = (nextTheme) => {
    setTheme(nextTheme);
    persistTheme(nextTheme);
    setThemeOpen(false);
  };

  const handleLogout = () => {
    setMobileOpen(false);
    setAccountOpen(false);
    logout();
  };

  const isActive = (href) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="relative left-1/2 w-screen -translate-x-1/2 bg-white/95 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="ScholarlyNest home" className="flex shrink-0 items-center rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950">
          <Image src="/logo.png" alt="ScholarlyNest" width={690} height={362} className="h-9 w-auto object-contain" priority />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Public navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`text-sm font-semibold underline-offset-8 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 ${isActive(link.href)
                  ? 'text-zinc-950 underline decoration-amber-600 decoration-2 dark:text-white dark:decoration-amber-400'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-350 dark:hover:text-white'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <div className="hidden w-64 lg:block">
            <GlobalSearchInput size="sm" placeholder="Search research..." />
          </div>

          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setThemeOpen((open) => !open)}
              aria-label="Change color theme"
              aria-expanded={themeOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-350 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              <ThemeIcon className="h-4 w-4" aria-hidden="true" />
            </button>

            {themeOpen && (
              <div className="absolute right-0 top-11 z-50 w-36 rounded-md bg-white p-1 shadow-lg ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
                {THEME_OPTIONS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNextTheme(value)}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${theme === value
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                        : 'text-zinc-650 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                      }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-label="Open account menu"
                aria-expanded={accountOpen}
                className="inline-flex max-w-[180px] items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-xs font-bold text-zinc-850 dark:bg-zinc-900 dark:text-zinc-100">
                  {user.profile_image_url || user.profile_image ? (
                    <img src={user.profile_image_url || user.profile_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user.name || user.email || 'U').charAt(0)
                  )}
                </span>
                <span className="truncate">{user.name || 'Account'}</span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-md bg-white p-2 shadow-xl ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
                  <div className="px-3 py-3">
                    <p className="truncate text-sm font-bold text-zinc-950 dark:text-white">{user.name || user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <RoleBadge user={user} />
                    </div>
                  </div>
                  <Link href="/admin" onClick={() => setAccountOpen(false)} className="mt-1 flex items-center gap-2 rounded px-3 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-250 dark:hover:bg-zinc-900">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Dashboard
                  </Link>
                  <Link href="/admin/settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded px-3 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-250 dark:hover:bg-zinc-900">
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    Account settings
                  </Link>
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950/20">
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-650 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white">Sign in</Link>
              <Link href="/register" className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">Register</Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-750 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-200 dark:hover:bg-zinc-900 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu" initialFocusRef={mobileInitialFocusRef} className="max-w-none sm:max-w-lg">
        <div className="space-y-6">
          <button ref={mobileInitialFocusRef} type="button" onClick={() => setMobileOpen(false)} className="sr-only">Close menu</button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <GlobalSearchInput size="sm" placeholder="Search research..." />
          </div>

          <nav className="grid gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`rounded-md px-3 py-3 text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${isActive(link.href)
                    ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                    : 'text-zinc-750 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {user ? (
            <div className="space-y-3 pt-3">
              <div className="space-y-2 rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-zinc-850 dark:bg-zinc-800 dark:text-zinc-100">
                    {user.profile_image_url || user.profile_image ? (
                      <img src={user.profile_image_url || user.profile_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (user.name || user.email || 'U').charAt(0)
                    )}
                  </span>
                  <p className="min-w-0 truncate text-base font-bold text-zinc-950 dark:text-white">{user.name || user.email}</p>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-350">{roleLabel}</p>
              </div>
              <Link href="/admin" className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Dashboard
              </Link>
              <button type="button" onClick={handleLogout} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950/20">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-3">
              <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-bold text-zinc-800 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-100 dark:hover:bg-zinc-900">Sign in</Link>
              <Link href="/register" className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-bold text-white dark:bg-white dark:text-zinc-950">Register</Link>
            </div>
          )}
        </div>
      </Dialog>
    </header>
  );
}
