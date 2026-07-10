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

export default function ArticleFilesPanel({ files = [], assets = [] }) {
  const supplementaryAssets = assets.filter((asset) => asset.asset_type !== 'image');
  const articleImages = assets.filter((asset) => asset.asset_type === 'image');

  return (
    <WorkflowSection
      title="Manuscript Files"
      description="Files available through the existing secured download routes."
      icon={Download}
      aside={<span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{files.length} visible</span>}
    >
      {files.length === 0 ? (
        <EmptyState title="No visible files">No manuscript files are available to your role right now.</EmptyState>
      ) : (
        <ul className="grid gap-2">
          {files.map((file) => (
            <li key={file.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--foreground)]">{file.original_name || fileTypeLabels[file.file_type] || 'Manuscript file'}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                    {fileTypeLabels[file.file_type] || labelize(file.file_type)} · {formatDate(file.created_at)}
                  </p>
                </div>
                <a
                  href={fileDownloadUrl(file.download_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Open
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      {supplementaryAssets.length > 0 && (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Supplementary Assets</h3>
          <ul className="mt-3 grid gap-2">
            {supplementaryAssets.map((asset) => (
              <li key={asset.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--foreground)]">{asset.title || asset.original_filename || 'Supplementary asset'}</p>
                    <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{asset.mime_type || 'File'}</p>
                  </div>
                  <a href={fileDownloadUrl(asset.download_url)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)]">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Open
                  </a>
                </div>
              </li>
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
