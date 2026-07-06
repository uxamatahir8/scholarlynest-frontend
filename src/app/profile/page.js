'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import SeoHead from '../../components/SeoHead';

export default function ProfileRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/admin/settings');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center py-48 space-y-4">
      <SeoHead
        title="Redirecting — ScholarlyNest"
        description="Redirecting you to your academic profile..."
        ogUrl="/profile"
      />
      <Loader2 className="w-8 h-8 animate-spin text-accent dark:text-accent-gold" />
      <span className="text-xs font-bold text-muted uppercase tracking-widest font-mono">
        Loading Profile View...
      </span>
    </div>
  );
}
