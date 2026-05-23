'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  LogOut,
  Bell,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  Menu,
  X,
  FileText,
  Sun,
  Moon,
  Monitor,
  Settings,
  Mail,
  MessageSquare
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, loading: authLoading, logout, hasRole, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [showNotifications, setShowNotifications] = useState(false);
  const [cmsDropdownOpen, setCmsDropdownOpen] = useState(false);
  const [magazineDropdownOpen, setMagazineDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Platform update deployed', desc: 'Sleek UI dynamically compiled globally.', time: '4h ago', unread: false },
  ]);

  // Sidebar Toggler States
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Theme Toggler States
  const [theme, setTheme] = useState('light');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  // Global Console Loader States
  const [apiLoading, setApiLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  // Listen to Axios request lifecycle
  useEffect(() => {
    let activeRequests = 0;
    
    const handleStart = () => {
      activeRequests++;
      if (activeRequests > 0) {
        setApiLoading(true);
      }
    };
    
    const handleEnd = () => {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) {
        setApiLoading(false);
      }
    };

    window.addEventListener('api-request-started', handleStart);
    window.addEventListener('api-request-ended', handleEnd);
    
    return () => {
      window.removeEventListener('api-request-started', handleStart);
      window.removeEventListener('api-request-ended', handleEnd);
    };
  }, []);

  // Listen to page path switching
  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 450);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  // Auto-collapse sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-collapse on mobile route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Auth gate & Theme Selection Sync
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-selection') || 'light';
      setTheme(savedTheme);
    }
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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const getRoleLabel = () => {
    if (!user) return '';
    return user.role?.display_name || user.roles?.[0]?.display_name || 'User';
  };

  useEffect(() => {
    if (pathname && pathname.startsWith('/admin/cms')) {
      setCmsDropdownOpen(true);
    }
    if (pathname && (pathname.startsWith('/admin/magazines') || pathname.startsWith('/admin/articles'))) {
      setMagazineDropdownOpen(true);
    }
  }, [pathname]);

  // Safe checks for rendering
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(30,58,138,0.5)]" />
          <span className="text-xs text-[var(--muted)] font-mono uppercase tracking-widest font-bold">Authenticating Connection...</span>
        </div>
      </div>
    );
  }

  // Active path logic
  const isOverviewActive = pathname === '/admin';
  const isRbacActive = pathname ? pathname.startsWith('/admin/rbac') : false;
  const isCmsActive = pathname ? pathname.startsWith('/admin/cms') : false;
  const isMagazineActive = pathname ? (pathname.startsWith('/admin/magazines') || pathname.startsWith('/admin/articles')) : false;

  // Hiding empty categories and pages dynamically
  const showMagazinePortal = hasPermission('magazines.view-any') || hasPermission('magazines.view-own') || hasPermission('articles.view-any') || hasPermission('articles.view-own');
  const showRbac = hasPermission('roles.view-any');
  const showContactSettings = hasPermission('settings.view-any') || hasPermission('settings.manage');
  const showContactMessages = hasPermission('settings.view-any') || hasPermission('settings.manage');
  const showNewsletter = hasPermission('newsletters.view-any');
  const showCms = hasPermission('settings.view-any') || hasPermission('settings.manage');

  return (
    <div className="h-screen w-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col md:flex-row transition-all duration-300 font-sans relative overflow-hidden">

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200" 
        />
      )}

      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-50 pointer-events-none z-0" />

      {/* ==========================================
          PORTAL SIDEBAR
          ========================================== */}
      <aside className={`
        /* Base styles */
        flex flex-col justify-between shrink-0 z-50 shadow-2xl overflow-y-auto transition-all duration-300 ease-in-out glass-panel
        
        /* Mobile Overlay position */
        fixed top-4 bottom-4 left-4 w-64 rounded-2xl border border-[var(--muted-border)]
        ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[calc(100%+2rem)] opacity-0'}
        
        /* Desktop Flex position */
        md:relative md:top-auto md:bottom-auto md:left-auto md:m-4 md:mr-0 md:h-[calc(100vh-2rem)]
        ${sidebarOpen ? 'md:w-64 md:translate-x-0 md:opacity-100' : 'md:w-0 md:-translate-x-full md:opacity-0 md:pointer-events-none md:-mr-4 md:m-0 md:border-none'}
      `}>
        
        {/* Subtle inner glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--accent)]/10 to-transparent pointer-events-none" />

        <div>
          {/* Brand Header */}
          <div className="h-20 px-6 border-b border-[var(--muted-border)] flex items-center justify-between relative z-10">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="ScholarlyNest Logo" width={690} height={362} className="h-10 sm:h-12 md:h-16 w-auto object-contain" priority />
            </Link>
            {/* Mobile close button inside sidebar */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 md:hidden transition-colors border border-transparent hover:border-red-500/20"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Summary */}
          <div className="p-5 border-b border-[var(--muted-border)] flex items-center space-x-4 bg-white/5 dark:bg-black/10 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-blue-900 flex items-center justify-center font-bold text-sm text-white shadow-[0_0_10px_rgba(30,58,138,0.4)] border border-blue-400/30 select-none">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold truncate text-[var(--foreground)]">{user.name}</h4>
              <span className="text-[9px] font-bold text-[var(--accent-gold)] flex items-center mt-0.5 uppercase tracking-widest">
                <ShieldAlert className="w-3 h-3 mr-1" />
                {getRoleLabel()}
              </span>
            </div>
          </div>

          {/* Sidebar Menu Links */}
          <nav className="p-4 space-y-2 relative z-10">
            <Link
              href="/admin"
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium ${isOverviewActive ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(30,58,138,0.4)]' : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Console Overview</span>
            </Link>

            <Link
              href="/admin/settings"
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium ${pathname === '/admin/settings' ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(30,58,138,0.4)]' : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'}`}
            >
              <Settings className="w-4 h-4" />
              <span>Security Settings</span>
            </Link>

            {/* My Articles for standard Authors who cannot view all magazine articles */}
            {hasPermission('articles.view-own') && !hasPermission('articles.view-any') && (
              <Link
                href="/admin/articles"
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium ${pathname === '/admin/articles' ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(30,58,138,0.4)]' : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'}`}
              >
                <FileText className="w-4 h-4" />
                <span>My Articles</span>
              </Link>
            )}

            {showMagazinePortal && (
              <div className="space-y-1">
                {/* Magazine Dropdown Toggle */}
                <button
                  onClick={() => setMagazineDropdownOpen(!magazineDropdownOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium ${isMagazineActive ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(30,58,138,0.4)]' : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'}`}
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4" />
                    <span>Magazine</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${magazineDropdownOpen ? 'rotate-90 text-[var(--accent-gold)]' : ''}`} />
                </button>

                {magazineDropdownOpen && (
                  <div className="pl-4 pr-2 py-1.5 space-y-1.5 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--muted-border)]/40 animate-in slide-in-from-top-1 duration-200">
                    {(hasPermission('magazines.view-any') || hasPermission('magazines.view-own')) && (
                      <Link
                        href="/admin/magazines"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${pathname === '/admin/magazines' ? 'text-[var(--accent-gold)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                        <span>Magazines Directory</span>
                      </Link>
                    )}
                    {(hasPermission('articles.view-any') || hasPermission('articles.view-own')) && (
                      <Link
                        href="/admin/articles"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${pathname === '/admin/articles' ? 'text-[var(--accent-gold)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                        <span>Magazine Articles</span>
                      </Link>
                    )}
                    {(hasPermission('articles.view-any') || hasPermission('articles.view-own') || hasPermission('magazines.view-any') || hasPermission('magazines.view-own')) && (
                      <Link
                        href="/admin/magazines/tags"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${pathname === '/admin/magazines/tags' ? 'text-[var(--accent-gold)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                        <span>Magazine Tags</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {showRbac && (
              <Link
                href="/admin/rbac"
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium ${isRbacActive ? 'bg-[var(--accent-gold)] text-slate-900 shadow-[0_0_15px_rgba(205,164,52,0.4)]' : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'}`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Access Control</span>
              </Link>
            )}

            {showContactSettings && (
              <Link
                href="/admin/contact-settings"
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium ${pathname === '/admin/contact-settings' ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(30,58,138,0.4)]' : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'}`}
              >
                <Mail className="w-4 h-4" />
                <span>Contact Settings</span>
              </Link>
            )}

            {showContactMessages && (
              <Link
                href="/admin/contact-messages"
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium ${pathname === '/admin/contact-messages' ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(30,58,138,0.4)]' : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Messages</span>
              </Link>
            )}

            {showNewsletter && (
              <Link
                href="/admin/newsletter"
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium ${pathname === '/admin/newsletter' ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(30,58,138,0.4)]' : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'}`}
              >
                <Mail className="w-4 h-4" />
                <span>Newsletter Manager</span>
              </Link>
            )}

            {showCms && (
              <div className="space-y-1">
                {/* CMS Dropdown Toggle */}
                <button
                  onClick={() => setCmsDropdownOpen(!cmsDropdownOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium ${isCmsActive ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(30,58,138,0.4)]' : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'}`}
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4" />
                    <span>CMS Pages</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${cmsDropdownOpen ? 'rotate-90 text-[var(--accent-gold)]' : ''}`} />
                </button>

                {cmsDropdownOpen && (
                  <div className="pl-4 pr-2 py-1.5 space-y-1.5 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--muted-border)]/40 animate-in slide-in-from-top-1 duration-200">
                    <Link
                      href="/admin/cms/terms"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${pathname === '/admin/cms/terms' ? 'text-[var(--accent-gold)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                      <span>Terms of Service</span>
                    </Link>
                    <Link
                      href="/admin/cms/privacy"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${pathname === '/admin/cms/privacy' ? 'text-[var(--accent-gold)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                      <span>Privacy Policy</span>
                    </Link>
                    <Link
                      href="/admin/cms/manifests"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${pathname === '/admin/cms/manifests' ? 'text-[var(--accent-gold)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                      <span>Metadata Manifests</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[var(--muted-border)] bg-white/5 dark:bg-black/10 relative z-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer border border-transparent hover:border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            <span className="uppercase tracking-wider">Sign Out Session</span>
          </button>
        </div>

      </aside>

      {/* ==========================================
          MAIN PORTAL CORE WORKSPACE
          ========================================== */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden z-10">

        {/* TOP BAR / PORTAL HEADER */}
        <header className="h-20 bg-transparent px-6 sm:px-8 flex items-center justify-between sticky top-0 backdrop-blur-sm z-45">

          {/* Breadcrumb Path with Toggler */}
          <div className="flex items-center space-x-3">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 glass-panel rounded-full hover:bg-white/10 text-[var(--muted)] hover:text-[var(--foreground)] relative transition-premium cursor-pointer border border-[var(--muted-border)] shadow-sm hover-glow flex items-center justify-center mr-1 z-40"
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex items-center space-x-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--muted)] select-none glass-panel px-4 py-2 rounded-full border border-[var(--muted-border)]">
              <span>Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
              <span className="text-[var(--foreground)]">
                {isOverviewActive ? 'Overview' : isRbacActive ? 'Access Control' : isCmsActive ? 'CMS Page Management' : isMagazineActive ? 'Magazine Portal' : 'Console'}
              </span>
            </div>
          </div>

          {/* Topbar Action Panel */}
          <div className="flex items-center space-x-5">

            {/* Theme Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-2.5 glass-panel rounded-full hover:bg-white/10 text-[var(--muted)] hover:text-[var(--foreground)] relative transition-premium cursor-pointer border border-[var(--muted-border)] shadow-sm hover-glow flex items-center justify-center"
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
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${theme === t ? 'bg-[var(--accent)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/10 text-[var(--muted)] hover:text-[var(--foreground)]'}`}
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

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 glass-panel rounded-full hover:bg-white/10 text-[var(--muted)] hover:text-[var(--foreground)] relative transition-premium cursor-pointer border border-[var(--muted-border)] shadow-sm hover-glow"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[var(--accent-gold)] rounded-full animate-pulse border border-[var(--background)] shadow-[0_0_8px_rgba(205,164,52,0.6)]" />
                )}
              </button>

              {/* Float Dropdown Notification list */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass-panel rounded-xl shadow-2xl py-2 z-50 text-xs border border-[var(--muted-border)] animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-[var(--muted-border)] flex items-center justify-between bg-black/5 dark:bg-white/5">
                    <span className="font-bold text-[var(--foreground)] text-[10px] uppercase tracking-widest">Notifications</span>
                    <button onClick={markAllNotificationsRead} className="text-[9px] font-bold text-[var(--accent)] hover:text-[var(--accent-gold)] uppercase tracking-widest transition-colors">Mark all read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`px-5 py-4 hover:bg-white/5 border-b border-[var(--muted-border)] flex flex-col space-y-1.5 transition-colors ${n.unread ? 'bg-[var(--accent)]/5' : ''}`}>
                        <div className="flex justify-between font-bold text-[var(--foreground)]">
                          <span>{n.title}</span>
                          <span className="text-[9px] font-medium text-[var(--muted)]">{n.time}</span>
                        </div>
                        <p className="text-[10px] font-medium text-[var(--muted)] leading-relaxed">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Render child sub-pages dynamically */}
        <main className="flex-grow p-6 sm:p-8 space-y-8 overflow-y-auto">
          {children}
        </main>

      </div>

      {/* Global Glassmorphic Loader Overlay */}
      {(apiLoading || pageLoading) && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[4px] z-[99999] flex flex-col items-center justify-center transition-all duration-300 animate-in fade-in">
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center space-y-4 shadow-2xl border border-[var(--muted-border)] max-w-xs text-center bg-[var(--card-bg)]">
            <div className="relative flex items-center justify-center">
              {/* Spinning Accent Border */}
              <div className="w-12 h-12 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
              {/* Inner Glowing Core */}
              <div className="absolute w-4 h-4 rounded-full bg-[var(--accent-gold)] animate-pulse shadow-[0_0_10px_rgba(191,161,105,0.8)]" />
            </div>
            <div className="space-y-1 select-none">
              <span className="text-[10px] font-bold text-[var(--foreground)] uppercase tracking-widest block font-mono">
                {apiLoading ? 'Processing Request' : 'Loading Workspace'}
              </span>
              <span className="text-[9px] text-[var(--muted)] block font-medium">
                Please wait while we sync database ledger...
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
