import React from 'react';
import { Search } from 'lucide-react';
import { notificationCategories, notificationPriorities } from '../../utils/notifications';

const inputClass = 'min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]';

export default function NotificationFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      <label className="relative xl:col-span-2">
        <span className="sr-only">Search notifications</span>
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
        <input value={filters.q} onChange={(event) => update('q', event.target.value)} placeholder="Search notifications" className={`${inputClass} w-full pl-9`} />
      </label>
      <label>
        <span className="sr-only">Category</span>
        <select value={filters.category} onChange={(event) => update('category', event.target.value)} className={`${inputClass} w-full`}>
          <option value="">All categories</option>
          {notificationCategories.map((category) => <option key={category} value={category}>{category.replace('_', ' ')}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Priority</span>
        <select value={filters.priority} onChange={(event) => update('priority', event.target.value)} className={`${inputClass} w-full`}>
          <option value="">All priorities</option>
          {notificationPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Article tracking code</span>
        <input value={filters.article_tracking_code} onChange={(event) => update('article_tracking_code', event.target.value)} placeholder="Tracking code" className={`${inputClass} w-full`} />
      </label>
      <label>
        <span className="sr-only">Created from date</span>
        <input type="date" value={filters.from} onChange={(event) => update('from', event.target.value)} className={`${inputClass} w-full`} aria-label="Created from date" />
      </label>
      <label>
        <span className="sr-only">Created through date</span>
        <input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => update('to', event.target.value)} className={`${inputClass} w-full`} aria-label="Created through date" />
      </label>
    </div>
  );
}
