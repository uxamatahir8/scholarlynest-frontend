'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import EmptyState from '../../ui/EmptyState';
import ErrorState from '../../ui/ErrorState';
import LoadingState from '../../ui/LoadingState';
import { DownloadRow } from './ArticleFilesPanel';
import { acceptedManuscriptView } from './workspaceManifest.mjs';
import { formatDate, labelize } from './workflowDisplay';

const metadataFields = [
  ['article_type', 'Article type'],
  ['classification', 'Classification'],
  ['subject_area', 'Subject area'],
  ['language', 'Language'],
];

const declarationFields = [
  ['ethical_approval_statement', 'Ethical approval'],
  ['conflict_of_interest_statement', 'Conflict of interest'],
  ['funding_statement', 'Funding'],
  ['data_availability_statement', 'Data availability'],
  ['author_contribution_statement', 'Author contributions'],
];

function FileGroup({ title, items }) {
  if (!items.length) return null;

  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{title}</h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((acceptedItem) => (
          <DownloadRow
            key={acceptedItem.id}
            item={acceptedItem.file}
            title={acceptedItem.file?.file_title || acceptedItem.file?.original_name || 'Accepted file'}
            meta={`${labelize(acceptedItem.accepted_role)} · Accepted production source`}
          />
        ))}
      </ul>
    </section>
  );
}

export default function AcceptedManuscriptInformationPanel({ articleId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!articleId) return;
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/admin/articles/${articleId}/accepted-manuscript`);
      setData(response.data?.data || null);
    } catch (err) {
      logError('Unable to load accepted manuscript:', err);
      setError(safeApiMessage(err, 'Accepted manuscript is not yet available.'));
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState label="Loading accepted manuscript…" className="min-h-72" />;
  if (error) return <ErrorState title="Accepted manuscript unavailable" onRetry={load}>{error}</ErrorState>;
  if (!data?.accepted_version) return <EmptyState title="Accepted manuscript is not yet available.">The accepted version will appear here after editorial acceptance.</EmptyState>;

  const view = acceptedManuscriptView(data);
  const keywords = Array.isArray(view.metadata.keywords) ? view.metadata.keywords : [];
  const declarations = declarationFields.filter(([key]) => view.declarations[key]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Accepted manuscript</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">{view.article.title || 'Untitled manuscript'}</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--muted)]">{view.publication?.name || 'Publication not recorded'}</p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-right">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{view.acceptedVersion.identifier}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Accepted {formatDate(view.acceptedVersion.accepted_at)}</p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Abstract</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">{view.article.abstract || 'No abstract was recorded for the accepted version.'}</p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metadataFields.map(([key, label]) => (
              <div key={key} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <dt className="text-xs font-semibold text-[var(--muted)]">{label}</dt>
                <dd className="mt-1 text-sm font-bold text-[var(--foreground)]">{view.metadata[key] || 'Not recorded'}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Keywords</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {keywords.length ? keywords.map((keyword) => <span key={keyword} className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold">{keyword}</span>) : <span className="text-sm text-[var(--muted)]">No keywords recorded.</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[var(--foreground)]">Authors and affiliations</h2>
        {view.authors.length ? (
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {view.authors.map((author, index) => (
              <li key={`${author.name}-${index}`} className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-sm font-bold">{author.name || 'Author name not recorded'}{author.is_corresponding ? ' · Corresponding author' : ''}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{author.affiliation || 'Affiliation not recorded'}</p>
              </li>
            ))}
          </ol>
        ) : <p className="mt-3 text-sm text-[var(--muted)]">No author information was recorded for the accepted version.</p>}
      </section>

      {(view.acceptedVersion.change_summary || view.acceptedVersion.revision_response) && (
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="text-base font-bold text-[var(--foreground)]">Revision information</h2>
          {view.acceptedVersion.change_summary && <div className="mt-4"><h3 className="text-xs font-bold uppercase text-[var(--muted)]">Change summary</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{view.acceptedVersion.change_summary}</p></div>}
          {view.acceptedVersion.revision_response && <div className="mt-4"><h3 className="text-xs font-bold uppercase text-[var(--muted)]">Revision response</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{view.acceptedVersion.revision_response}</p></div>}
        </section>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[var(--foreground)]">Accepted production files</h2>
        {!view.acceptedFileSet ? (
          <EmptyState title="The article has been accepted, but the production file set has not yet been finalized." className="mt-4">Accepted files will appear when the production set is ready.</EmptyState>
        ) : (
          <div className="mt-5 space-y-6">
            <FileGroup title="Manuscript files" items={view.manuscriptFiles} />
            <FileGroup title="Additional files" items={view.additionalFiles} />
            <FileGroup title="Supplementary files" items={view.supplementaryFiles} />
          </div>
        )}
      </section>

      {declarations.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[var(--foreground)]">Production declarations</h2>
          <dl className="mt-4 space-y-4">
            {declarations.map(([key, label]) => <div key={key}><dt className="text-xs font-bold uppercase text-[var(--muted)]">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6">{view.declarations[key]}</dd></div>)}
          </dl>
        </section>
      )}
    </div>
  );
}
