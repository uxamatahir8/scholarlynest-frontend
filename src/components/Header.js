'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Monitor, Sun, Moon, LayoutDashboard, Menu, X, Shield, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import GlobalSearchInput from './home/GlobalSearchInput';

const PUBLIC_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Magazines', href: '/magazines' },
  { label: 'Contact', href: '/contact' }
];

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Theme states
  const [theme, setTheme] = useState('light');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-selection') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const currentSelection = localStorage.getItem('theme-selection') || 'system';
      if (currentSelection === 'system') {
        const root = document.documentElement;
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const applyTheme = (targetTheme) => {
    const root = document.documentElement;
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (targetTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light');
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme-selection', newTheme);
    applyTheme(newTheme);
    setThemeDropdownOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getRoleLabel = (roleName) => {
    switch (roleName?.toLowerCase().replace('_', '-')) {
      case 'super_admin': return 'Admin';
      case 'editor': return 'Editor';
      default: return 'Author';
    }
  };

  return (
    <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 dark:bg-zinc-950/95 shadow-sm border-b border-zinc-150 dark:border-zinc-900/60 backdrop-blur-md' : 'bg-transparent'}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col transition-all duration-500">
          {/* Main Header Row */}
          <div className="flex items-center justify-between w-full h-20">
            {/* Left Brand Area */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center group">
                <Image
                  src="/logo.png"
                  alt="ScholarlyNest Logo"
                  width={690}
                  height={362}
                  className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Center Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8 text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {PUBLIC_NAV_LINKS.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors py-1.5 relative ${isActive ? 'text-amber-600 dark:text-amber-400' : 'hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-amber-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Search Input & User Controls */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Search Bar (Desktop Only) */}
              <div className="hidden lg:block w-56 xl:w-72 relative z-50">
                <GlobalSearchInput size="sm" placeholder="Search registry..." />
              </div>

              {/* Theme Selector */}
              <div className="relative">
                <button
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  aria-label="Change Color Theme"
                >
                  {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
                  {theme === 'dark' && <Moon className="w-4 h-4 text-amber-400" />}
                  {theme === 'system' && <Monitor className="w-4 h-4" />}
                </button>

                {themeDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-32 rounded-xl border border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900 p-1 shadow-lg z-50 text-[10px] font-sans font-bold uppercase tracking-wider animate-in fade-in duration-200 backdrop-blur-md">
                    {['light', 'dark', 'system'].map((t) => (
                      <button
                        key={t}
                        onClick={() => handleThemeChange(t)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${theme === t ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'}`}
                      >
                        {t === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                        {t === 'dark' && <Moon className="w-3.5 h-3.5 text-amber-400" />}
                        {t === 'system' && <Monitor className="w-3.5 h-3.5" />}
                        <span className="capitalize">{t}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Account / Auth Dropdown */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 px-1.5 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors border border-transparent"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-sans font-bold text-[10px] uppercase border border-amber-500/20">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold pr-1 max-w-[100px] truncate text-zinc-750 dark:text-zinc-200">
                      {user.name}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900 p-1 shadow-lg z-50 text-[10px] font-sans font-bold uppercase tracking-wider animate-in fade-in duration-200 backdrop-blur-md">
                      <div className="px-3 py-2 mb-1 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-850">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">Access Level</span>
                        <Badge variant="gold">{user.roles?.[0] ? getRoleLabel(user.roles[0].name) : 'User'}</Badge>
                      </div>

                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-amber-500/5 hover:text-amber-600 dark:hover:text-amber-400 text-zinc-700 dark:text-zinc-350 transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Console Dashboard</span>
                      </Link>

                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1"></div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-500/5 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out Session</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login" className="hidden sm:inline">
                    <Button variant="ghost" size="sm" className="text-[11px] py-1.5 h-auto">Log In</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="gold" size="sm" className="text-[11px] py-2 h-auto text-white">Register</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-zinc-400 hover:text-zinc-905 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-4 px-6 animate-in slide-in-from-top-1 duration-200">
          <div className="space-y-4">
            {/* Search Input for Mobile */}
            <div className="relative z-50">
              <GlobalSearchInput size="sm" placeholder="Search registry..." />
            </div>

            <div className="flex flex-col space-y-2.5">
              {PUBLIC_NAV_LINKS.map(link => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              {user ? (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-450 flex items-center justify-center font-bold text-xs uppercase border border-amber-500/20">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{user.name}</span>
                        <span className="text-[10px] text-zinc-400 font-semibold">{user.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="p-2 text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                      aria-label="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center"
                  >
                    <Button className="w-full py-2 text-xs" variant="secondary">Dashboard Console</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button className="w-full py-2 text-xs" variant="secondary">Log In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button className="w-full py-2 text-xs bg-amber-600 text-white" variant="gold">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
