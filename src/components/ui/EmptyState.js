import React from 'react';

export default function EmptyState({ icon: Icon, title = 'Nothing here yet', children, action, className = '' }) {
  return (
    <div className={`rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-8 text-center ${className}`}>
      {Icon && <Icon className="mx-auto mb-3 h-6 w-6 text-[var(--muted)]" aria-hidden="true" />}
      <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
      {children && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
