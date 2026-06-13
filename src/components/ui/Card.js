import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <section
      className={`border-y border-zinc-100 bg-white/70 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/35 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return <div className={`px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ className = '', children, ...props }) {
  return <h3 className={`font-serif text-xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-white ${className}`} {...props}>{children}</h3>;
}

export function CardDescription({ className = '', children, ...props }) {
  return <p className={`text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 ${className}`} {...props}>{children}</p>;
}

export function CardContent({ className = '', children, ...props }) {
  return <div className={`p-6 ${className}`} {...props}>{children}</div>;
}

export function CardFooter({ className = '', children, ...props }) {
  return <div className={`px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 ${className}`} {...props}>{children}</div>;
}
