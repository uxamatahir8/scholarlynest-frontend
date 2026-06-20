'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RbacRedirector() {
  const { user, hasRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && hasRole('super_admin')) {
        router.replace('/admin/users');
      } else {
        router.replace('/admin');
      }
    }
  }, [user, loading, hasRole, router]);

  return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-amber-600 dark:text-amber-400" />
      <span className="text-xs font-bold text-zinc-405 uppercase tracking-widest font-mono">Redirecting Workspace...</span>
    </div>
  );
}
