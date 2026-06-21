'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import api from '../../utils/api';
import { logError } from '../../utils/safeLogger';
import { getRoleDisplayName } from '../../utils/roles';
import { getStoredTheme, setTheme as persistTheme, applyTheme } from '../../utils/theme';
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
  Newspaper,
  BriefcaseBusiness,
  FileCheck2,
  Users,
  Search,
  ChevronDown,
  Workflow
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, loading: authLoading, logout, hasRole, hasPermission, impersonationStatus, stopImpersonationSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [stoppingImpersonation, setStoppingImpersonation] = useState(false);

  const handleReturnToSuperAdmin = async () => {
    setStoppingImpersonation(true);
    try {
      const res = await api.post('/admin/impersonation/stop');
      const { user: superAdminData, access_token } = res.data;
      stopImpersonationSession(superAdminData, access_token);
      router.push('/admin/users');
    } catch (err) {
      logError('Failed to stop impersonation:', err);
    } finally {
      setStoppingImpersonation(false);
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [cmsDropdownOpen, setCmsDropdownOpen] = useState(false);
  const [magazineDropdownOpen, setMagazineDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [workflowDropdownOpen, setWorkflowDropdownOpen] = useState(false);
  const [userManagementDropdownOpen, setUserManagementDropdownOpen] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState('');
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
      const savedTheme = getStoredTheme();
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    persistTheme(newTheme);
    setThemeDropdownOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSearchSubmit = () => {
    if (topSearchQuery.trim()) {
      router.push(`/admin/search-results?q=${encodeURIComponent(topSearchQuery.trim())}`);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const getRoleLabel = () => getRoleDisplayName(user);

  useEffect(() => {
    if (pathname && pathname.startsWith('/admin/cms')) {
      setCmsDropdownOpen(true);
    }
    if (pathname && (pathname.startsWith('/admin/magazines') || pathname.startsWith('/admin/articles') || pathname.startsWith('/admin/issues'))) {
      setMagazineDropdownOpen(true);
    }
    if (pathname && pathname.startsWith('/admin/settings')) {
      setSettingsDropdownOpen(true);
    }
    if (user && hasRole('super_admin') && pathname && (
      pathname.startsWith('/admin/sub-editor') ||
      pathname.startsWith('/admin/reviewer') ||
      pathname.startsWith('/admin/copy-editor') ||
      pathname.startsWith('/admin/proofreader') ||
      pathname.startsWith('/admin/publisher')
    )) {
      setWorkflowDropdownOpen(true);
    }
    if (pathname && (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/user-management'))) {
      setUserManagementDropdownOpen(true);
    }
  }, [pathname, user]);

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
  const isUserManagementActive = pathname ? (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/user-management')) : false;
  const isCmsActive = pathname ? (pathname.startsWith('/admin/cms') || pathname.startsWith('/admin/footer-cms')) : false;
  const isMagazineActive = pathname ? (pathname.startsWith('/admin/magazines') || pathname.startsWith('/admin/articles') || pathname.startsWith('/admin/issues')) : false;
  const isSubEditorDeskActive = pathname ? pathname.startsWith('/admin/sub-editor') : false;
  const isReviewerDeskActive = pathname ? pathname.startsWith('/admin/reviewer') : false;
  const isCopyEditorDeskActive = pathname ? pathname.startsWith('/admin/copy-editor') : false;
  const isProofreaderDeskActive = pathname ? pathname.startsWith('/admin/proofreader') : false;
  const isPublisherDeskActive = pathname ? pathname.startsWith('/admin/publisher') : false;
  const isSettingsActive = pathname ? pathname.startsWith('/admin/settings') : false;
  const isWorkflowActive = pathname ? (
    pathname.startsWith('/admin/sub-editor') ||
    pathname.startsWith('/admin/reviewer') ||
    pathname.startsWith('/admin/copy-editor') ||
    pathname.startsWith('/admin/proofreader') ||
    pathname.startsWith('/admin/publisher')
  ) : false;

  const isEditorRole = hasRole('editor') || hasRole('magazine_editor') || hasRole('magazine-editor');
  const isNonImpersonatedSuperAdmin = hasRole('super_admin') && !impersonationStatus?.active;
  const showMySubEditors = isEditorRole;
  const showIssueManager = hasRole('publisher') || hasRole('super_admin') || hasRole('admin');
  const showMagazineDirectory = (hasPermission('magazines.view-any') || hasPermission('magazines.view-own')) && !hasRole('author');
  const showArticleBoard = hasPermission('articles.view-any') || isEditorRole;
  const showMagazineTags = hasRole('super_admin') || hasRole('admin');
  const showMagazinePortal = showIssueManager || showMagazineDirectory || showArticleBoard || showMagazineTags;
  const showAdvancedSettings = hasPermission('settings.manage') || hasRole('super_admin') || hasRole('admin');
  const showSubEditorDesk = hasRole('sub_editor') || hasRole('super_admin') || hasRole('admin');
  const showReviewerDesk = hasRole('reviewer') || hasRole('super_admin') || hasRole('admin');
  const showCopyEditorDesk = hasRole('copy_editor') || hasRole('super_admin') || hasRole('admin');
  const showProofreaderDesk = hasRole('proofreader') || hasRole('super_admin') || hasRole('admin');
  const showPublisherDesk = hasRole('publisher') || hasRole('super_admin') || hasRole('admin');
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
        flex flex-col shrink-0 z-50 transition-all duration-300 ease-in-out bg-zinc-900 border-r border-zinc-800 text-zinc-300 h-screen
        
        /* Mobile drawer overlay positioning */
        fixed top-0 bottom-0 left-0 w-64
        ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}
        
        /* Desktop stationary positioning */
        lg:relative lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto
        ${sidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:pointer-events-none lg:border-none'}
      `}>

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

          {/* Scrollable Nav Links */}
          <div className="flex-1 overflow-y-auto sidebar-scroll">
          <nav className="p-4 space-y-1.5 text-[10px] font-bold uppercase tracking-wider">
            <Link
              href="/admin"
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isOverviewActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Console Overview</span>
            </Link>

            {hasRole('author') && hasPermission('articles.view-own') && !hasPermission('articles.view-any') && (
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
                    {showMagazineDirectory && (
                      <Link
                        href="/admin/magazines"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/magazines' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span>Magazines Directory</span>
                      </Link>
                    )}
                    {showArticleBoard && (
                      <Link
                        href="/admin/articles"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/articles' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span>Magazine Articles</span>
                      </Link>
                    )}
                    {showMagazineTags && (
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

            {isNonImpersonatedSuperAdmin && (
              <div className="space-y-1">
                <button
                  onClick={() => setWorkflowDropdownOpen(!workflowDropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ${isWorkflowActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Workflow className="w-4 h-4" />
                    <span>Workflow Desks</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${workflowDropdownOpen ? 'rotate-90 text-amber-500' : 'text-zinc-500'}`} />
                </button>

                {workflowDropdownOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l border-zinc-800 ml-5 animate-in slide-in-from-top-1 duration-200">
                    <Link
                      href="/admin/sub-editor"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/sub-editor' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Sub Editor Desk</span>
                    </Link>
                    <Link
                      href="/admin/reviewer"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/reviewer' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Reviewer Desk</span>
                    </Link>
                    <Link
                      href="/admin/copy-editor"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/copy-editor' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <BriefcaseBusiness className="w-3.5 h-3.5" />
                      <span>Copy Editor Desk</span>
                    </Link>
                    <Link
                      href="/admin/proofreader"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/proofreader' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Proofreader Desk</span>
                    </Link>
                    <Link
                      href="/admin/publisher"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/publisher' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>Publisher Desk</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {showMySubEditors && (
              <Link
                href="/admin/editor/sub-editors"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${pathname === '/admin/editor/sub-editors' ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <Users className="w-4 h-4" />
                <span>My Sub Editors</span>
              </Link>
            )}

            {!hasRole('super_admin') && showSubEditorDesk && (
              <Link
                href="/admin/sub-editor"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isSubEditorDeskActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Sub Editor Desk</span>
              </Link>
            )}

            {!hasRole('super_admin') && showReviewerDesk && (
              <Link
                href="/admin/reviewer"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isReviewerDeskActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Reviewer Desk</span>
              </Link>
            )}

            {!hasRole('super_admin') && showCopyEditorDesk && (
              <Link
                href="/admin/copy-editor"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isCopyEditorDeskActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <BriefcaseBusiness className="w-4 h-4" />
                <span>Copy Editor Desk</span>
              </Link>
            )}

            {!hasRole('super_admin') && showProofreaderDesk && (
              <Link
                href="/admin/proofreader"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isProofreaderDeskActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Proofreader Desk</span>
              </Link>
            )}

            {!hasRole('super_admin') && showPublisherDesk && (
              <Link
                href="/admin/publisher"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isPublisherDeskActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <Newspaper className="w-4 h-4" />
                <span>Publisher Desk</span>
              </Link>
            )}

            {isNonImpersonatedSuperAdmin && (
              <div className="space-y-1">
                <button
                  onClick={() => setUserManagementDropdownOpen(!userManagementDropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ${isUserManagementActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${userManagementDropdownOpen ? 'rotate-90 text-amber-500' : 'text-zinc-500'}`} />
                </button>

                {userManagementDropdownOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l border-zinc-800 ml-5 animate-in slide-in-from-top-1 duration-200">
                    <Link
                      href="/admin/users"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/users' || pathname.startsWith('/admin/users/') ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-current" />
                      <span>User Accounts</span>
                    </Link>
                    <Link
                      href="/admin/user-management/roles-permissions"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/user-management/roles-permissions' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-current" />
                      <span>Roles & Permission Matrix</span>
                    </Link>
                    <Link
                      href="/admin/user-management/registration-settings"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/user-management/registration-settings' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-current" />
                      <span>Registration Settings</span>
                    </Link>
                  </div>
                )}
              </div>
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

            {showAdvancedSettings ? (
              <div className="space-y-1">
                <button
                  onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ${isSettingsActive ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${settingsDropdownOpen ? 'rotate-90 text-amber-500' : 'text-zinc-500'}`} />
                </button>

                {settingsDropdownOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l border-zinc-800 ml-5 animate-in slide-in-from-top-1 duration-200">
                    <Link
                      href="/admin/settings"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/settings' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>Security Settings</span>
                    </Link>
                    <Link
                      href="/admin/settings/types"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/settings/types' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>Article Types</span>
                    </Link>
                    <Link
                      href="/admin/settings/categories"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/settings/categories' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>Categories</span>
                    </Link>
                    <Link
                      href="/admin/settings/subject-areas"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/settings/subject-areas' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>Subject Areas</span>
                    </Link>
                    <Link
                      href="/admin/settings/languages"
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${pathname === '/admin/settings/languages' ? 'text-amber-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>Languages</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/admin/settings"
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${pathname === '/admin/settings' ? 'bg-amber-500/5 text-amber-450 border border-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/35 border border-transparent'}`}
              >
                <Settings className="w-4 h-4" />
                <span>Security Settings</span>
              </Link>
            )}
          </nav>
          </div>

        {/* Bottom logout section */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/20 shrink-0">
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
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden z-10 animate-in fade-in duration-300">

        {/* Impersonation Banner */}
        {impersonationStatus && impersonationStatus.active && (
          <div className="bg-amber-600 dark:bg-amber-700 text-white px-6 py-2.5 flex items-center justify-between shadow-md z-50 text-xs font-bold font-sans animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0" />
              <span>You are currently logged in as <span className="underline">{impersonationStatus.impersonated_user?.name}</span>.</span>
            </div>
            <button
              onClick={handleReturnToSuperAdmin}
              disabled={stoppingImpersonation}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-all text-[10px] uppercase tracking-wider cursor-pointer font-sans leading-none"
            >
              {stoppingImpersonation ? 'Restoring Session...' : 'Return to Super Admin'}
            </button>
          </div>
        )}

        {/* TOP BAR / PORTAL HEADER */}
        <header className="py-5 border-b border-zinc-200/60 dark:border-zinc-900/60 px-6 sm:px-8 flex items-center justify-between sticky top-0 backdrop-blur-md bg-white/70 dark:bg-zinc-955/70 z-40">

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
                {isOverviewActive ? 'Overview' : isUserManagementActive ? 'User Management' : isCmsActive ? 'CMS Page Management' : isMagazineActive ? 'Magazine Portal' : isSubEditorDeskActive ? 'Sub Editor Desk' : isReviewerDeskActive ? 'Reviewer Desk' : isCopyEditorDeskActive ? 'Copy Editor Desk' : isProofreaderDeskActive ? 'Proofreader Desk' : isPublisherDeskActive ? 'Publisher Desk' : 'Console'}
              </span>
            </div>
          </div>

          {/* Search bar in the top bar */}
          <div className="relative flex-grow max-w-xs mx-4 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search panel..."
              value={topSearchQuery}
              onChange={(e) => setTopSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
              className="w-full text-xs font-semibold pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-105"
            />
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
                    <button onClick={markAllNotificationsRead} className="text-[9px] font-bold text-amber-605 hover:text-amber-550 uppercase tracking-wider">Mark read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="px-5 py-4 border-b border-zinc-50 dark:border-zinc-850 flex flex-col space-y-1">
                        <div className="flex justify-between font-bold text-zinc-805 dark:text-zinc-205">
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

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-white/80 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-805 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-850/60 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-605 dark:text-amber-450 flex items-center justify-center font-bold text-[9px] uppercase border border-amber-500/20">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden md:inline text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-450" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900 p-1.5 shadow-lg z-50 text-[10px] font-bold uppercase tracking-wider animate-in fade-in duration-200 backdrop-blur-md">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-850 mb-1">
                    <p className="text-[8px] text-zinc-400">Signed in as</p>
                    <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate mt-0.5">{user.name}</p>
                  </div>
                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-zinc-550 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-405 dark:hover:text-white transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Profile Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-red-505 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
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
