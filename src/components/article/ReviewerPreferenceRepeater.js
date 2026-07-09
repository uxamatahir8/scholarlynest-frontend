'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const createEmptyReviewerPreference = () => ({
  name: '',
  email: '',
  affiliation: '',
  designation: '',
  reason: '',
});

export function normalizeReviewerPreferences(rows = []) {
  return rows
    .map((row) => ({
      ...createEmptyReviewerPreference(),
      ...row,
      email: (row.email || '').trim().toLowerCase(),
    }))
    .filter((row) => row.name.trim() || row.email.trim() || row.affiliation.trim() || row.reason.trim());
}

export default function ReviewerPreferenceRepeater({ title, description, rows, setRows, tone = 'suggested' }) {
  const addRow = () => setRows([...rows, createEmptyReviewerPreference()]);
  const removeRow = (index) => setRows(rows.filter((_, idx) => idx !== index));
  const updateRow = (index, field, value) => {
    setRows(rows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)));
  };

  const rowClass = tone === 'opposed'
    ? 'rounded-xl border border-rose-500/20 bg-[var(--surface)] p-5 shadow-sm'
    : 'rounded-xl border border-emerald-500/20 bg-[var(--surface)] p-5 shadow-sm';

  return (
    <div className="space-y-5 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">{title}</h3>
          {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{description}</p>}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-6 text-sm text-[var(--muted)]">
          No reviewers added.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div key={index} className={rowClass}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[var(--foreground)]">Reviewer {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={`Remove reviewer ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['name', 'Full name', 'Dr. Alice Smith', 'text'],
                  ['email', 'Email address', 'alice@example.edu', 'email'],
                  ['affiliation', 'Affiliation', 'University or institute', 'text'],
                  ['designation', 'Designation', 'Professor, Scientist', 'text'],
                ].map(([field, label, placeholder, type]) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-bold text-[var(--foreground)]">{label}</label>
                    <input
                      type={type}
                      value={row[field] || ''}
                      onChange={(event) => updateRow(index, field, event.target.value)}
                      placeholder={placeholder}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-bold text-[var(--foreground)]">Reason / note</label>
                <textarea
                  value={row.reason || ''}
                  onChange={(event) => updateRow(index, 'reason', event.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
