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
  const useDocumentScroll = pathname === '/admin/articles/new' || /^\/admin\/articles\/[^/]+\/edit$/.test(pathname || '');

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
