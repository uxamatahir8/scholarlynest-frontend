'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Monitor, Sun, Moon, LayoutDashboard, Menu, X, Shield, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

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

  // Collapse mobile navigation drawer on route changes
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
      // Placeholder search navigation
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
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
    <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-0 md:py-4'}`}>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`glass-header rounded-2xl px-4 sm:px-6 flex flex-col transition-all duration-500 shadow-lg transition-premium border ${scrolled ? 'border-[var(--card-border)]' : 'border-transparent'}`}>

          {/* TOP ROW: BRAND, SEARCH, AND CONTROLS */}
          <div className="flex items-center justify-between w-full h-[70px]">
            {/* LEFT: BRAND IDENTITY */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center group">
                <Image
                  src="/logo.png"
                  alt="ScholarlyNest Logo"
                  width={690}
                  height={362}
                  className="h-8 sm:h-20 md:h-30 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </Link>
            </div>

            {/* MIDDLE: PREMIUM INTEGRATED SEARCH BAR */}
            <div className="hidden md:flex items-center flex-grow max-w-md mx-8">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <div className="relative flex items-center group">
                  <Search className="absolute left-3 w-4 h-4 text-[var(--muted)] group-focus-within:text-[var(--accent-gold)] transition-colors" />
                  <input
                    type="text"
                    placeholder="Search articles, authors, records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-12 py-1.5 rounded-full text-xs font-medium border border-[var(--muted-border)] bg-[var(--background)] focus:outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] transition-all placeholder:text-gray-400"
                  />
                  <span className="absolute right-3.5 text-[9px] font-mono text-gray-400 select-none group-focus-within:opacity-0 transition-opacity">
                    ⌘K
                  </span>
                </div>
              </form>
            </div>

            {/* RIGHT: CONTROLS & AUTH */}
            <div className="flex items-center space-x-3 sm:space-x-4">

              {/* Theme Toggle Button */}
              <div className="relative">
                <button
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent hover:border-[var(--muted-border)]"
                  aria-label="Change Color Theme"
                >
                  {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
                  {theme === 'dark' && <Moon className="w-4 h-4 text-[var(--accent-gold)]" />}
                  {theme === 'system' && <Monitor className="w-4 h-4" />}
                </button>

                {themeDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-36 glass-panel rounded-xl shadow-xl overflow-hidden z-50 text-xs font-semibold p-1 animate-in fade-in duration-200">
                    {['light', 'dark', 'system'].map((t) => (
                      <button
                        key={t}
                        onClick={() => handleThemeChange(t)}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left transition-colors ${theme === t ? 'bg-[var(--accent)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/10 text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                      >
                        {t === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                        {t === 'dark' && <Moon className="w-3.5 h-3.5 text-[var(--accent-gold)]" />}
                        {t === 'system' && <Monitor className="w-3.5 h-3.5" />}
                        <span className="capitalize">{t}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auth panel */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 px-1.5 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-[var(--muted-border)] group"
                  >
                    <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-[0_0_10px_rgba(44,67,102,0.2)]">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold pr-1 max-w-[100px] truncate text-[var(--foreground)]">
                      {user.name}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-xl z-50 text-xs font-semibold p-1.5 animate-in fade-in duration-200">
                      <div className="px-3 py-2 mb-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--muted-border)]">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] block mb-1">Access Level</span>
                        <Badge variant="gold">{user.roles?.[0] ? getRoleLabel(user.roles[0].name) : 'User'}</Badge>
                      </div>

                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-[var(--accent)] hover:text-white text-[var(--foreground)] transition-colors group"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-white" />
                        <span>Console Dashboard</span>
                      </Link>

                      <div className="h-px bg-[var(--muted-border)] my-1.5"></div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
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
                    <Button variant="ghost" size="sm" className="text-xs py-1.5 h-auto">Log In</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="gold" size="sm" className="text-xs py-3 h-auto bg-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/90 text-white">Register</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Action */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[var(--muted)] hover:text-[var(--foreground)] rounded-full focus:outline-none hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div> {/* Closes RIGHT: CONTROLS & AUTH */}

          </div> {/* Closes TOP ROW */}

          {/* BOTTOM ROW: CENTERED NAVIGATION MENU */}
          <div className="hidden lg:flex items-center justify-center w-full py-3 border-t border-[var(--card-border)]/60">
            <nav className="flex items-center space-x-12 text-[12px] font-semibold uppercase tracking-widest">
              {PUBLIC_NAV_LINKS.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors py-1 relative ${isActive ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-0 w-full h-[2px] bg-[var(--accent-gold)] rounded-full animate-fade-in" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

        </div>
      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden mx-auto w-full max-w-7xl px-4 mt-2">
          <div className="glass-panel rounded-2xl p-4 space-y-4 shadow-xl border border-[var(--card-border)] bg-[var(--card-bg)] animate-in fade-in duration-300">

            {/* Mobile Search input */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-[var(--muted-border)] bg-[var(--background)] focus:outline-none focus:border-[var(--accent-gold)]"
              />
            </form>

            <div className="space-y-1">
              {PUBLIC_NAV_LINKS.map(link => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${isActive ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--foreground)]'}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-[var(--muted-border)] pt-4">
              {user ? (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-xs uppercase">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[var(--foreground)]">{user.name}</span>
                        <span className="text-[10px] text-[var(--muted)]">{user.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                      aria-label="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full"
                  >
                    <Button className="w-full py-2 text-xs" variant="secondary">Go to Console</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button className="w-full py-2 text-xs" variant="secondary">Log In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <Button className="w-full py-2 text-xs bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-gold)]/90" variant="primary">Register</Button>
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
