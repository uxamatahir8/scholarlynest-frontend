'use client';

import { usePathname } from 'next/navigation';
import PublicShell from './layout/PublicShell';

export default function MainLayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return <PublicShell pathname={pathname}>{children}</PublicShell>;
}
