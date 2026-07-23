import React from 'react';

export default function NotificationCountBadge({ count, label = 'unread notifications', className = '' }) {
  if (!count) return null;
  return (
    <span className={`inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ${className}`}>
      <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
      <span className="sr-only">{count} {label}</span>
    </span>
  );
}
