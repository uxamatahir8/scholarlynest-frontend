'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Monitor, Moon, Search, Sun, UserRound, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRole, getRoleDisplayName } from '../utils/roles';
import { applyTheme, getStoredTheme, setTheme as persistTheme } from '../utils/theme';
import { Button } from './ui/Button';
import Dialog from './ui/Dialog';
import RoleBadge from './ui/RoleBadge';
import GlobalSearchInput from './home/GlobalSearchInput';

const PUBLIC_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Explore Magazines', href: '/magazines' },
  { label: 'About', href: '/about' },
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const mobileCloseRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setThemeDropdownOpen(false);
    setUserDropdownOpen(false);
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
  const CurrentThemeIcon = THEME_OPTIONS.find((option) => option.value === theme)?.Icon || Sun;

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    persistTheme(nextTheme);
    setThemeDropdownOpen(false);
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
  };

  const navLinkClass = (href) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return `inline-flex h-10 items-center border-b-2 px-1 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 ${
      active
        ? 'border-amber-600 text-zinc-950 dark:border-amber-400 dark:text-white'
        : 'border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-350 dark:hover:text-white'
    }`;
  };

  return (
    <header className={`fixed-header-offset relative w-full border-b transition-colors duration-300 ${scrolled ? 'border-zinc-200 bg-white/95 shadow-sm backdrop-blur dark:border-zinc-850 dark:bg-zinc-950/95' : 'border-transparent bg-white/80 backdrop-blur-sm dark:bg-zinc-950/70'}`}>
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950" aria-label="Scholarly Nest home">
          <Image src="/logo.png" alt="Scholarly Nest" width={690} height={362} className="h-10 w-auto object-contain" priority />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {PUBLIC_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass(link.href)} aria-current={(link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)) ? 'page' : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <div className="hidden w-64 lg:block xl:w-80">
            <GlobalSearchInput size="sm" placeholder="Search articles, authors, magazines..." />
          </div>

          <button
            type="button"
            onClick={() => setThemeDropdownOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:text-zinc-350 dark:hover:bg-zinc-900 dark:hover:text-white dark:focus:ring-offset-zinc-950"
            aria-label="Change color theme"
            aria-expanded={themeDropdownOpen}
          >
            <CurrentThemeIcon className="h-4 w-4" aria-hidden="true" />
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-20 top-16 z-50 w-40 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 sm:right-28">
              {THEME_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleThemeChange(value)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${theme === value ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' : 'text-zinc-650 hover:bg-zinc-100 dark:text-zinc-350 dark:hover:bg-zinc-900'}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {user ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setUserDropdownOpen((open) => !open)}
                className="inline-flex max-w-[220px] items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-zinc-850 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:text-zinc-100 dark:hover:bg-zinc-900 dark:focus:ring-offset-zinc-950"
                aria-label="Open account menu"
                aria-expanded={userDropdownOpen}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-50 text-xs font-bold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                  {(user.name || user.email || 'U').charAt(0)}
                </span>
                <span className="truncate">{user.name || 'Account'}</span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/70">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Signed in as</p>
                    <p className="mt-1 truncate text-sm font-bold text-zinc-950 dark:text-white">{user.name || user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-500">Role</span>
                      <RoleBadge user={user} />
                    </div>
                  </div>
                  <Link href="/admin" onClick={() => setUserDropdownOpen(false)} className="mt-2 flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-250 dark:hover:bg-zinc-900">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Console dashboard
                  </Link>
                  <Link href="/admin/settings" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-zinc-250 dark:hover:bg-zinc-900">
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                    Profile and account
                  </Link>
                  <button type="button" onClick={handleLogout} className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-zinc-100 px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-850 dark:hover:bg-red-950/20">
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login"><Button variant="secondary" size="sm">Log in</Button></Link>
              <Link href="/register"><Button variant="primary" size="sm">Register</Button></Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:text-zinc-200 dark:hover:bg-zinc-900 dark:focus:ring-offset-zinc-950 md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Dialog open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Menu" description="Navigate Scholarly Nest" initialFocusRef={mobileCloseRef} className="max-w-none sm:max-w-lg">
        <div className="space-y-6">
          <button ref={mobileCloseRef} type="button" onClick={() => setMobileMenuOpen(false)} className="sr-only">Close menu</button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <GlobalSearchInput size="sm" placeholder="Search articles, authors, magazines..." />
          </div>

          <nav className="grid gap-2" aria-label="Mobile navigation">
            {PUBLIC_NAV_LINKS.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={`rounded-lg px-4 py-3 text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${active ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' : 'text-zinc-750 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900'}`} aria-current={active ? 'page' : undefined}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-850">
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Signed in as</p>
                <p className="mt-1 text-base font-bold text-zinc-950 dark:text-white">{user.name || user.email}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-350">Role: {roleLabel}</p>
              </div>
              <Link href="/admin" className="flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Console dashboard
              </Link>
              <button type="button" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-900/50 dark:hover:bg-red-950/20">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-850">
              <Link href="/login"><Button variant="secondary" className="w-full">Log in</Button></Link>
              <Link href="/register"><Button variant="primary" className="w-full">Register</Button></Link>
            </div>
          )}
        </div>
      </Dialog>
    </header>
  );
}
