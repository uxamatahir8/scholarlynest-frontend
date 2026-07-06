import React from 'react';
import { friendlyStatus, statusTone } from './publicationUtils';

const toneClasses = {
  amber: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  blue: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  zinc: 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
};

export default function PublicationStatusBadge({ status }) {
  const tone = statusTone(status);

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone] || toneClasses.zinc}`}>
      {friendlyStatus(status)}
    </span>
  );
}
