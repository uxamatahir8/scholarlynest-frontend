import React from 'react';
import { formatDate } from '../../../utils/date';

export default function DeskRecordMetadata({ trackingCode, assigneeName, dueDate = null }) {
  const items = [
    { label: 'Article tracking code', value: trackingCode || 'Not assigned' },
    { label: 'Assignee Name', value: assigneeName || 'Not assigned' },
    ...(dueDate ? [{ label: 'Due date', value: formatDate(dueDate) }] : []),
  ];

  return (
    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="font-semibold text-[var(--muted)]">{item.label}</dt>
          <dd className="mt-0.5 font-bold text-[var(--foreground)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
