import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <div 
      className={`glass-panel rounded-2xl shadow-lg overflow-hidden transition-premium hover:shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`px-6 py-5 border-b border-[var(--muted-border)] flex flex-col space-y-1.5 bg-white/5 dark:bg-black/10 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`text-lg font-bold leading-none tracking-tight text-[var(--foreground)] ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-sm text-[var(--muted)] ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`px-6 py-4 border-t border-[var(--muted-border)] flex items-center bg-white/5 dark:bg-black/10 ${className}`} {...props}>
      {children}
    </div>
  );
}
