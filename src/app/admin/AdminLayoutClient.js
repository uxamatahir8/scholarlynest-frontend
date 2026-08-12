'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ConsoleShell from '../../components/admin/console/ConsoleShell';
import { NotificationProvider } from '../../context/NotificationContext';

export default function AdminLayoutClient({ children }) {
  const auth = useAuth();
  return (
    <NotificationProvider enabled={!auth.loading && Boolean(auth.user)}>
      <ConsoleShell auth={auth}>{children}</ConsoleShell>
    </NotificationProvider>
  );
}
