import React from 'react';

export default function DashboardSection({ title, description, action, children, className = '' }) {
  return (
    <section className={`space-y-4 ${className}`} aria-labelledby={title ? `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-section` : undefined}>
      {(title || description || action) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {title && <h2 id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-section`} className="text-base font-bold text-[var(--foreground)]">{title}</h2>}
            {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
