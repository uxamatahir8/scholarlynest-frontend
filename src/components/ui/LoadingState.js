import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`} role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-amber-600" aria-hidden="true" />
      <span className="text-sm font-semibold text-[var(--muted)]">{label}</span>
    </div>
  );
}
