'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '../../../utils/api';
import { logError } from '../../../utils/safeLogger';
import { applyTheme, getStoredTheme, setTheme as persistTheme } from '../../../utils/theme';
import LoadingState from '../../ui/LoadingState';
import UniversityGateModal from '../../dashboard/UniversityGateModal';
import ConsoleSidebar from './ConsoleSidebar';
import ConsoleTopbar from './ConsoleTopbar';
import ConsoleMobileDrawer from './ConsoleMobileDrawer';
import ConsoleImpersonationBanner from './ConsoleImpersonationBanner';
import { getVisibleConsoleNavigation } from './consoleNavigation';

export default function ConsoleShell({ children, auth }) {
  const {
    user,
    loading: authLoading,
    logout,
    hasPermission,
    impersonationStatus,
    stopImpersonationSession,
  } = auth;
  const router = useRouter();
  const pathname = usePathname();
  const mobileButtonRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [stoppingImpersonation, setStoppingImpersonation] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, router, user]);

  useEffect(() => {
    const storedTheme = getStoredTheme();
    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    persistTheme(nextTheme);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleReturnToSuperAdmin = async () => {
    setStoppingImpersonation(true);
    try {
      const response = await api.post('/admin/impersonation/stop');
      const { user: superAdminData, access_token } = response.data;
      stopImpersonationSession(superAdminData, access_token);
      router.push('/admin/users');
    } catch (err) {
      logError('Failed to stop impersonation:', err);
    } finally {
      setStoppingImpersonation(false);
    }
  };

  const navigation = useMemo(
    () => getVisibleConsoleNavigation({ user, hasPermission, impersonationStatus }),
    [user, hasPermission, impersonationStatus],
  );

  useEffect(() => {
    if (!pathname) return;

    let pageTitle = 'Admin Console';

    // 1. Check exact/prefix matches from navigation items
    const flatItems = navigation.flatMap((section) => section.items || []);
    const navMatch = [...flatItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)));

    if (navMatch) {
      pageTitle = navMatch.label;
    }

    // 2. Override with specific sub-page/dynamic-route patterns
    if (pathname === '/admin') {
      pageTitle = 'Dashboard';
    } else if (pathname === '/admin/articles/new') {
      pageTitle = 'New Submission';
    } else if (/^\/admin\/articles\/[^/]+\/workflow$/.test(pathname)) {
      pageTitle = 'Manuscript Workflow';
    } else if (/^\/admin\/articles\/[^/]+\/edit$/.test(pathname)) {
      pageTitle = 'Edit Manuscript';
    } else if (pathname === '/admin/users/create') {
      pageTitle = 'Create User';
    } else if (/^\/admin\/users\/[^/]+\/edit$/.test(pathname)) {
      pageTitle = 'Edit User';
    } else if (/^\/admin\/magazines\/[^/]+\/pages$/.test(pathname)) {
      pageTitle = 'Magazine Pages';
    } else if (pathname === '/admin/support/new') {
      pageTitle = 'New Support Ticket';
    } else if (/^\/admin\/support\/[^/]+$/.test(pathname)) {
      pageTitle = 'Support Ticket Chat';
    } else if (/^\/admin\/support-tickets\/[^/]+$/.test(pathname)) {
      pageTitle = 'Review Support Ticket';
    } else if (/^\/admin\/rbac$/.test(pathname)) {
      pageTitle = 'Redirecting...';
    } else if (pathname === '/admin/search-results') {
      pageTitle = 'Search Results';
    } else if (/^\/admin\/cms\/[^/]+$/.test(pathname)) {
      const parts = pathname.split('/');
      const slug = parts[parts.length - 1];
      if (slug !== 'faqs') {
        const readableSlug = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        pageTitle = `${readableSlug} - CMS`;
      }
    }

    document.title = `${pageTitle} | ScholarlyNest`;
  }, [pathname, navigation]);

  const useDocumentScroll = pathname === '/admin/articles/new' || /^\/admin\/articles\/[^/]+\/(edit|workflow)$/.test(pathname || '');

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <LoadingState label="Authenticating console..." />
      </div>
    );
  }

  return (
    <div className={`${useDocumentScroll ? 'min-h-screen' : 'h-screen overflow-hidden'} bg-[var(--console-bg)] text-[var(--foreground)]`}>
      <div className={`flex min-h-0 ${useDocumentScroll ? 'min-h-screen' : 'h-full'}`}>
        <ConsoleSidebar user={user} navigation={navigation} pathname={pathname} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ConsoleImpersonationBanner
            impersonationStatus={impersonationStatus}
            onReturn={handleReturnToSuperAdmin}
            returning={stoppingImpersonation}
          />
          <ConsoleTopbar
            user={user}
            pathname={pathname}
            navigation={navigation}
            onOpenMobileNav={() => setMobileOpen(true)}
            mobileButtonRef={mobileButtonRef}
            theme={theme}
            onThemeChange={handleThemeChange}
            onLogout={handleLogout}
            impersonationStatus={impersonationStatus}
            onStopImpersonation={handleReturnToSuperAdmin}
            stoppingImpersonation={stoppingImpersonation}
          />
          <main className={`min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 ${useDocumentScroll ? '' : 'min-h-0 overflow-y-auto'}`}>
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </main>
        </div>
      </div>

      <ConsoleMobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navigation={navigation}
        pathname={pathname}
        triggerRef={mobileButtonRef}
      />

      {stoppingImpersonation && (
        <div className="fixed bottom-4 right-4 z-[var(--z-toast)] inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm font-semibold shadow-[var(--shadow-md)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Restoring Super Admin session
        </div>
      )}

      <UniversityGateModal />
    </div>
  );
}
