import React from 'react';
import { Download } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import WorkflowSection from './WorkflowSection';
import { fileTypeLabels, formatDate, labelize } from './workflowDisplay';
import api from '../../../utils/api';

function fileDownloadUrl(path) {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  const apiBase = (api.defaults.baseURL || '').replace(/\/$/, '');
  const suffix = path.startsWith('/api/') ? path.replace(/^\/api/, '') : path;
  return `${apiBase}${suffix}`;
}

function DownloadRow({ item, title, meta }) {
  return (
    <li className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--foreground)]">{title}</p>
          <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{meta}</p>
        </div>
        <a
          href={fileDownloadUrl(item.download_url)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Open
        </a>
      </div>
    </li>
  );
}

export default function ArticleFilesPanel({ files = [], assets = [] }) {
  const manuscriptFiles = files.filter((file) => file.file_type === 'manuscript');
  const supplementaryFileRecords = files.filter((file) => file.file_type === 'supplementary');
  const workflowFiles = files.filter((file) => !['manuscript', 'supplementary'].includes(file.file_type));
  const supplementaryAssets = assets.filter((asset) => asset.asset_type !== 'image');
  const articleImages = assets.filter((asset) => asset.asset_type === 'image');
  const supplementaryItems = [
    ...supplementaryFileRecords.map((file) => ({ kind: 'file', item: file })),
    ...supplementaryAssets.map((asset) => ({ kind: 'asset', item: asset })),
  ];

  return (
    <WorkflowSection
      title="Files"
      description="Files available through the existing secured download routes."
      icon={Download}
      aside={<span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{files.length} visible</span>}
    >
      {files.length === 0 && assets.length === 0 ? (
        <EmptyState title="No visible files">No manuscript files are available to your role right now.</EmptyState>
      ) : (
        <div className="space-y-5">
          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Manuscript File</h3>
              <span className="text-xs font-bold text-[var(--muted)]">{manuscriptFiles.length} file{manuscriptFiles.length === 1 ? '' : 's'}</span>
            </div>
            {manuscriptFiles.length === 0 ? (
              <EmptyState title="No manuscript file">The original manuscript file is not visible to your role right now.</EmptyState>
            ) : (
              <ul className="grid gap-2">
                {manuscriptFiles.map((file) => (
                  <DownloadRow
                    key={file.id}
                    item={file}
                    title={file.original_name || 'Original manuscript'}
                    meta={`${fileTypeLabels[file.file_type] || labelize(file.file_type)} · ${formatDate(file.created_at)}`}
                  />
                ))}
              </ul>
            )}
          </section>

          {workflowFiles.length > 0 && (
            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Workflow Files</h3>
              <ul className="grid gap-2">
                {workflowFiles.map((file) => (
                  <DownloadRow
                    key={file.id}
                    item={file}
                    title={file.original_name || fileTypeLabels[file.file_type] || 'Workflow file'}
                    meta={`${fileTypeLabels[file.file_type] || labelize(file.file_type)} · ${formatDate(file.created_at)}`}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
      {supplementaryItems.length > 0 && (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Supplementary Assets</h3>
          <ul className="mt-3 grid gap-2">
            {supplementaryItems.map(({ kind, item }) => (
              <DownloadRow
                key={`${kind}-${item.id}`}
                item={item}
                title={item.title || item.original_filename || item.original_name || 'Supplementary asset'}
                meta={kind === 'file' ? `${fileTypeLabels[item.file_type] || labelize(item.file_type)} · ${formatDate(item.created_at)}` : item.mime_type || 'File'}
              />
            ))}
          </ul>
        </div>
      )}
      {articleImages.length > 0 && (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Article Images</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {articleImages.map((asset) => (
              <figure key={asset.id} className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-muted)]">
                <img src={fileDownloadUrl(asset.download_url)} alt={asset.title || asset.original_filename || 'Article image'} className="h-40 w-full object-cover" />
                {(asset.title || asset.caption) && <figcaption className="p-3 text-xs text-[var(--muted)]">{asset.title || asset.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      )}
    </WorkflowSection>
  );
}
