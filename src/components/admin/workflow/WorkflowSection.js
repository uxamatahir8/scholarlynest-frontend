import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';

export default function WorkflowSection({ title, description, icon: Icon, children, aside, className = '' }) {
  return (
    <Card className={`border border-[var(--border)] bg-[var(--surface)] ${className}`}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {aside}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
