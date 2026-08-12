import React from 'react';

export default function Skeleton({ className = '', ...props }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 ${className}`} aria-hidden="true" {...props} />;
}
