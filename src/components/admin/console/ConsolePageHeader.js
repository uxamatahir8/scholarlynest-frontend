import React from 'react';

export default function ConsolePageHeader({
  breadcrumbs,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}) {
  return (
    <header className={`space-y-4 border-b border-[var(--border)] pb-5 ${className}`}>
      {breadcrumbs}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {title && <h1 className="font-serif text-2xl font-bold leading-tight text-[var(--foreground)]">{title}</h1>}
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    </header>
  );
}
