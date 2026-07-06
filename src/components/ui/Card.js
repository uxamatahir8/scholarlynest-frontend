import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <section className={`rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm ${className}`} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return <div className={`px-6 py-5 border-b border-[var(--border)] ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ className = '', children, ...props }) {
  return <h3 className={`font-serif text-xl font-semibold leading-tight text-[var(--foreground)] ${className}`} {...props}>{children}</h3>;
}

export function CardDescription({ className = '', children, ...props }) {
  return <p className={`text-sm leading-relaxed text-[var(--muted)] ${className}`} {...props}>{children}</p>;
}

export function CardContent({ className = '', children, ...props }) {
  return <div className={`p-6 ${className}`} {...props}>{children}</div>;
}

export function CardFooter({ className = '', children, ...props }) {
  return <div className={`px-6 py-4 border-t border-[var(--border)] ${className}`} {...props}>{children}</div>;
}
