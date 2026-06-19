'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import UniversityGateModal from '../../components/dashboard/UniversityGateModal';
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
  MessageSquare,
  Loader2,
  ClipboardCheck,
  UserCheck,
  Newspaper
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
      if (window.innerWidth < 1024) {
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
    if (window.innerWidth < 1024) {
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
    if (pathname && (pathname.startsWith('/admin/magazines') || pathname.startsWith('/admin/articles') || pathname.startsWith('/admin/issues'))) {
      setMagazineDropdownOpen(true);
    }
  }, [pathname]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
          <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-sans font-bold uppercase tracking-widest">Authenticating Connection...</span>
        </div>
      </div>
    );
  }

  // Active path logic
  const isOverviewActive = pathname === '/admin';
  const isRbacActive = pathname ? pathname.startsWith('/admin/rbac') : false;
  const isCmsActive = pathname ? (pathname.startsWith('/admin/cms') || pathname.startsWith('/admin/footer-cms')) : false;
  const isMagazineActive = pathname ? (pathname.startsWith('/admin/magazines') || pathname.startsWith('/admin/articles') || pathname.startsWith('/admin/issues')) : false;
  const isSubEditorDeskActive = pathname ? pathname.startsWith('/admin/sub-editor') : false;
  const isReviewerDeskActive = pathname ? pathname.startsWith('/admin/reviewer') : false;

  const showMagazinePortal = hasPermission('magazines.view-any') || hasPermission('magazines.view-own') || hasPermission('articles.view-any') || hasPermission('articles.view-own');
  const showIssueManager = hasRole('publisher') || hasRole('super_admin') || hasRole('admin');
  const showSubEditorDesk = hasRole('sub_editor') || hasRole('super_admin') || hasRole('admin');
  const showReviewerDesk = hasRole('reviewer') || hasRole('super_admin') || hasRole('admin');
  const showRbac = hasPermission('roles.view-any');
  const showContactSettings = hasPermission('settings.view-any') || hasPermission('settings.manage') || hasPermission('footer.manage');
  const showContactMessages = hasPermission('settings.view-any') || hasPermission('settings.manage') || hasPermission('footer.manage');
  const showNewsletter = hasPermission('newsletters.view-any');
  const showCms = hasPermission('settings.view-any') || hasPermission('settings.manage') || hasPermission('footer.manage');

  return (
    <div className="h-screen w-screen bg-zinc-50/50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col lg:flex-row transition-all duration-300 font-sans relative overflow-hidden text-left">

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200" 
        />
      )}

      {/* ==========================================
          PORTAL SIDEBAR (bg-zinc-900 slate framework)
          ========================================== */}
      <aside className={`
        flex flex-col justify-between shrink-0 z-50 overflow-y-auto transition-all duration-300 ease-in-out bg-zinc-900 border-r border-zinc-800 text-zinc-300
        
        /* Mobile drawer overlay positioning */
        fixed top-0 bottom-0 left-0 w-64
        ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}
        
        /* Desktop stationary positioning */
        lg:relative lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto
        ${sidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:pointer-events-none lg:border-none'}
      `}>
        
        <div>
          {/* Header logo container */}
          <div className="h-20 px-6 border-b border-zinc-800/80 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="ScholarlyNest Logo" 
                width={690} 
                height={362} 
                className="h-9 w-auto object-contain brightness-0 invert" 
                priority 
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 lg:hidden transition-colors border border-transparent"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User profile section */}
          <div className="p-5 border-b border-zinc-800/80 flex items-center space-x-3 bg-zinc-950/20">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs uppercase border border-amber-500/20 shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden min-w-0">
              <h4 className="text-xs font-bold truncate text-white leading-tight">{user.name}</h4>
              <span className="text-[9px] font-bold text-amber-500 flex items-center mt-1 uppercase tracking-wider font-mono leading-none">
                <ShieldAlert className="w-3 h-3 mr-1" />
                {getRoleLabel()}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1.5 text-[10px] font-bold uppercase tracking-wider">
            <Link
              href="/admin"
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isOverviewActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Console Overview</span>
            </Link>

            {hasPermission('articles.view-own') && !hasPermission('articles.view-any') && (
              <Link
                href="/admin/articles"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${pathname === '/admin/articles' ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <FileText className="w-4 h-4" />
                <span>My Articles</span>
              </Link>
            )}

            {showMagazinePortal && (
              <div className="space-y-1">
                <button
                  onClick={() => setMagazineDropdownOpen(!magazineDropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ${isMagazineActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4" />
                    <span>Magazine</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${magazineDropdownOpen ? 'rotate-90 text-amber-500' : 'text-zinc-500'}`} />
                </button>

                {magazineDropdownOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l border-zinc-800 ml-5 animate-in slide-in-from-top-1 duration-200">
                    {(hasPermission('magazines.view-any') || hasPermission('magazines.view-own')) && (
                      <Link
                        href="/admin/magazines"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/magazines' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span>Magazines Directory</span>
                      </Link>
                    )}
                    {(hasPermission('articles.view-any') || hasPermission('articles.view-own')) && (
                      <Link
                        href="/admin/articles"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/articles' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span>Magazine Articles</span>
                      </Link>
                    )}
                    {(hasPermission('articles.view-any') || hasPermission('articles.view-own') || hasPermission('magazines.view-any') || hasPermission('magazines.view-own')) && (
                      <Link
                        href="/admin/magazines/tags"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/magazines/tags' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span>Magazine Tags</span>
                      </Link>
                    )}
                    {showIssueManager && (
                      <Link
                        href="/admin/issues"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/issues' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                      >
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>Issue Manager</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {showSubEditorDesk && (
              <Link
                href="/admin/sub-editor"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isSubEditorDeskActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Sub Editor Desk</span>
              </Link>
            )}

            {showReviewerDesk && (
              <Link
                href="/admin/reviewer"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isReviewerDeskActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Reviewer Desk</span>
              </Link>
            )}

            {showRbac && (
              <Link
                href="/admin/rbac"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isRbacActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Access Control</span>
              </Link>
            )}

            {showContactSettings && (
              <Link
                href="/admin/contact-settings"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${pathname === '/admin/contact-settings' ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <Mail className="w-4 h-4" />
                <span>Contact Settings</span>
              </Link>
            )}

            {showContactMessages && (
              <Link
                href="/admin/contact-messages"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${pathname === '/admin/contact-messages' ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Messages</span>
              </Link>
            )}

            {showNewsletter && (
              <Link
                href="/admin/newsletter"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${pathname === '/admin/newsletter' ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <Mail className="w-4 h-4" />
                <span>Newsletter Manager</span>
              </Link>
            )}

            {showCms && (
              <div className="space-y-1">
                <button
                  onClick={() => setCmsDropdownOpen(!cmsDropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ${isCmsActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4" />
                    <span>CMS Pages</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${cmsDropdownOpen ? 'rotate-90 text-amber-500' : 'text-zinc-500'}`} />
                </button>

                {cmsDropdownOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l border-zinc-800 ml-5 animate-in slide-in-from-top-1 duration-200">
                    <Link
                      href="/admin/cms/faqs"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/cms/faqs' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>Manage FAQs</span>
                    </Link>
                    {(hasPermission('footer.manage') || hasPermission('settings.manage')) && (
                      <Link
                        href="/admin/footer-cms"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/footer-cms' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>Footer Menu Builder</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            <Link
              href="/admin/settings"
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${pathname === '/admin/settings' ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
            >
              <Settings className="w-4 h-4" />
              <span>Security Settings</span>
            </Link>
          </nav>
        </div>

        {/* Bottom logout section */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-[10px] font-bold text-red-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent transition-colors cursor-pointer uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>

      </aside>

      {/* ==========================================
          MAIN PORTAL CORE WORKSPACE
          ========================================== */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden z-10">

        {/* TOP BAR / PORTAL HEADER */}
        <header className="h-20 border-b border-zinc-200/60 dark:border-zinc-900/60 px-6 sm:px-8 flex items-center justify-between sticky top-0 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 z-40">

          {/* Toggle button and breadcrumbs path */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-white/80 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <span>Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-zinc-800 dark:text-zinc-200">
                {isOverviewActive ? 'Overview' : isRbacActive ? 'Access Control' : isCmsActive ? 'CMS Page Management' : isMagazineActive ? 'Magazine Portal' : 'Console'}
              </span>
            </div>
          </div>

          {/* Action panels: notifications and color switches */}
          <div className="flex items-center space-x-4">
            
            {/* Theme Select Toggler */}
            <div className="relative">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-2 bg-white/80 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-905 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Change Color Theme"
              >
                {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
                {theme === 'dark' && <Moon className="w-4 h-4 text-amber-400" />}
                {theme === 'system' && <Monitor className="w-4 h-4" />}
              </button>

              {themeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl border border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900 p-1 shadow-lg z-50 text-[10px] font-bold uppercase tracking-wider animate-in fade-in duration-200 backdrop-blur-md">
                  {['light', 'dark', 'system'].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleThemeChange(t)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${theme === t ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
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

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-white/80 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-905 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xl py-2 z-50 text-xs animate-in fade-in duration-200">
                  <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
                    <span className="font-bold text-zinc-800 dark:text-white text-[10px] uppercase tracking-wider">Notifications</span>
                    <button onClick={markAllNotificationsRead} className="text-[9px] font-bold text-amber-600 hover:text-amber-505 uppercase tracking-wider">Mark read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="px-5 py-4 border-b border-zinc-50 dark:border-zinc-850 flex flex-col space-y-1">
                        <div className="flex justify-between font-bold text-zinc-800 dark:text-zinc-200">
                          <span>{n.title}</span>
                          <span className="text-[9px] font-semibold text-zinc-400">{n.time}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-405 leading-relaxed">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Dynamic portal core children container */}
        <main className="flex-grow p-6 sm:p-8 space-y-8 overflow-y-auto bg-zinc-50/20 dark:bg-zinc-950/10">
          {children}
        </main>

      </div>

      {/* Dynamic Loader screen overlays */}
      {(apiLoading || pageLoading) && (
        <div className="fixed inset-0 bg-zinc-950/20 dark:bg-zinc-950/40 backdrop-blur-sm z-[99999] flex flex-col items-center justify-center animate-in fade-in">
          <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl flex flex-col items-center space-y-4 shadow-xl max-w-xs text-center">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest block font-mono">
                {apiLoading ? 'Processing Request' : 'Loading Workspace'}
              </span>
              <span className="text-[9px] text-zinc-450 dark:text-zinc-500 block font-medium">
                Please wait while we synchronize catalog ledger...
              </span>
            </div>
          </div>
        </div>
      )}

      <UniversityGateModal />

    </div>
  );
}
