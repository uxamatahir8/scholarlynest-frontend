'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ConsoleShell from '../../components/admin/console/ConsoleShell';

export default function AdminLayoutClient({ children }) {
  const auth = useAuth();
  return <ConsoleShell auth={auth}>{children}</ConsoleShell>;
}
