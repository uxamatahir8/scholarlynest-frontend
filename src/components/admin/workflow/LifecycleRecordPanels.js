'use client';

import React from 'react';
import { CheckCircle2, FileCheck2, Layers3 } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import StatusBadge from '../../ui/StatusBadge';
import { formatDate, submissionVersionLabel } from './workflowDisplay';

export function VersionsOverview({ article, onSelectVersion }) {
  const versions = [...(article.versions || [])].sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0));
  if (!versions.length) return <EmptyState title="No submitted versions">A version is created when the manuscript is submitted.</EmptyState>;
  return (
    <section className="space-y-4" aria-labelledby="versions-heading">
      <div>
        <h2 id="versions-heading" className="text-lg font-bold text-[var(--foreground)]">Immutable manuscript versions</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Original and revised submissions remain available according to your role.</p>
      </div>
      <ol className="grid gap-3">
        {versions.map((version) => {
          const accepted = Number(article.accepted_version_id) === Number(version.id) || Boolean(version.accepted_at);
          return (
            <li key={version.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300"><Layers3 className="h-5 w-5" /></span>
                  <div>
                    <p className="font-bold text-[var(--foreground)]">{submissionVersionLabel(version)}{accepted ? ' (Accepted)' : ''}</p>
                    <p className="text-xs text-[var(--muted)]">Submitted {formatDate(version.submitted_at || version.created_at)} · {(version.files || []).length} visible files</p>
                  </div>
                </div>
                <button type="button" onClick={() => onSelectVersion(version.id)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                  Open version
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function ProofRoundsPanel({ article }) {
  const rounds = article.proof_rounds || [];
  if (!rounds.length) return <EmptyState title="No proof rounds">Proofreading begins after copyediting is completed.</EmptyState>;
  return (
    <section className="space-y-4" aria-labelledby="proof-heading">
      <div><h2 id="proof-heading" className="text-lg font-bold">Production proof rounds</h2><p className="mt-1 text-sm text-[var(--muted)]">Proof rounds are separate from editorial revision numbers.</p></div>
      <ol className="grid gap-3">
        {rounds.map((round) => (
          <li key={round.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">{round.label || `Proof ${round.round_number}`}</p><StatusBadge status={round.status} /></div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase text-[var(--muted)]">Requested</dt><dd>{formatDate(round.requested_at)}</dd></div><div><dt className="text-xs font-bold uppercase text-[var(--muted)]">Due</dt><dd>{formatDate(round.due_at)}</dd></div></dl>
            {round.author_comments && <div className="mt-3 rounded-lg bg-[var(--surface-muted)] p-3"><p className="text-xs font-bold uppercase text-[var(--muted)]">Author comments</p><p className="mt-1 whitespace-pre-wrap text-sm">{round.author_comments}</p></div>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PublicationRecordsPanel({ article }) {
  const records = article.publication_records || [];
  if (!records.length) return <EmptyState title="No publication record">Publication preparation starts after the final proof is approved.</EmptyState>;
  return (
    <section className="space-y-4" aria-labelledby="publication-heading">
      <div><h2 id="publication-heading" className="text-lg font-bold">Publication preparation</h2><p className="mt-1 text-sm text-[var(--muted)]">Only approved publication candidates are represented here.</p></div>
      {records.map((record) => (
        <article key={record.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-[var(--accent)]" /><h3 className="font-bold">Publication record #{record.id}</h3></div><StatusBadge status={record.status} /></div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-xs font-bold uppercase text-[var(--muted)]">DOI</dt><dd>{record.doi || 'Not assigned'}</dd></div><div><dt className="text-xs font-bold uppercase text-[var(--muted)]">Issue</dt><dd>{record.magazine_issue_id || 'Not assigned'}</dd></div><div><dt className="text-xs font-bold uppercase text-[var(--muted)]">Pages</dt><dd>{record.page_start && record.page_end ? `${record.page_start}–${record.page_end}` : 'Not assigned'}</dd></div><div><dt className="text-xs font-bold uppercase text-[var(--muted)]">Primary PDF</dt><dd>{record.files?.filter((file) => file.is_primary).length === 1 ? 'Selected' : 'Required'}</dd></div></dl>
        </article>
      ))}
    </section>
  );
}

export function AcceptedBoundaryPanel({ article }) {
  const set = article.accepted_file_set;
  if (!set) return <EmptyState title="No accepted file set">Acceptance creates the immutable production source.</EmptyState>;
  return <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h2 className="font-bold">Accepted production boundary</h2></div><p className="mt-2 text-sm text-[var(--muted)]">Version {set.article_version_id} · {set.items?.length || 0} pinned files · accepted {formatDate(set.accepted_at)}</p></div>;
}
