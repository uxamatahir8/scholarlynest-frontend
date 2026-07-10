import React from 'react';
import { Download, FileImage, Files, Sheet } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import ImageLightboxGallery from '../../ui/ImageLightboxGallery';
import WorkflowSection from './WorkflowSection';
import { fileTypeLabels, formatDate, labelize } from './workflowDisplay';
import api from '../../../utils/api';

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const sheetExtensions = new Set(['xls', 'xlsx', 'csv']);
const imageMimePrefixes = ['image/'];
const sheetMimes = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

function fileDownloadUrl(path) {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  const apiBase = (api.defaults.baseURL || '').replace(/\/$/, '');
  const suffix = path.startsWith('/api/') ? path.replace(/^\/api/, '') : path;
  return `${apiBase}${suffix}`;
}

function assetTitle(item) {
  return item.title || item.original_filename || item.original_name || 'Supplementary asset';
}

function assetMeta(kind, item) {
  if (kind === 'file') {
    return `${fileTypeLabels[item.file_type] || labelize(item.file_type)} · ${formatDate(item.created_at)}`;
  }
  return item.mime_type || 'File';
}

function extensionFor(item) {
  const source = assetTitle(item);
  const match = String(source || '').toLowerCase().match(/\.([a-z0-9]+)(?:$|\?)/);
  return match?.[1] || '';
}

function supplementaryGroup(kind, item) {
  const extension = extensionFor(item);
  const mime = String(item.mime_type || item.detected_mime_type || item.declared_mime_type || '').toLowerCase();
  if (item.asset_type === 'image' || imageExtensions.has(extension) || imageMimePrefixes.some((prefix) => mime.startsWith(prefix))) {
    return 'images';
  }
  if (sheetExtensions.has(extension) || sheetMimes.has(mime)) {
    return 'sheets';
  }
  return 'files';
}

function galleryImage(entry) {
  const item = entry.item;
  return {
    src: fileDownloadUrl(item.download_url),
    title: assetTitle(item),
    caption: item.caption,
    description: item.description,
    alt: assetTitle(item),
  };
}

function DownloadRow({ item, title, meta }) {
  return (
    <li className="min-w-0 max-w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
      <div className="grid min-w-0 max-w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0 overflow-hidden">
          <p className="max-w-full truncate text-sm font-bold text-[var(--foreground)]" title={title}>{title}</p>
          <p className="mt-1 max-w-full truncate text-xs font-semibold text-[var(--muted)]" title={meta}>{meta}</p>
        </div>
        <a
          href={fileDownloadUrl(item.download_url)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:w-auto"
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
  const supplementaryItems = [
    ...supplementaryFileRecords.map((file) => ({ kind: 'file', item: file })),
    ...assets.map((asset) => ({ kind: 'asset', item: asset })),
  ];
  const groupedSupplementaryItems = supplementaryItems.reduce((groups, entry) => {
    groups[supplementaryGroup(entry.kind, entry.item)].push(entry);
    return groups;
  }, { images: [], sheets: [], files: [] });
  const supplementaryGroups = [
    { id: 'images', title: 'Images', icon: FileImage, items: groupedSupplementaryItems.images },
    { id: 'sheets', title: 'Sheets and Data', icon: Sheet, items: groupedSupplementaryItems.sheets },
    { id: 'files', title: 'Files and Documents', icon: Files, items: groupedSupplementaryItems.files },
  ].filter((group) => group.items.length > 0);

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
        <div className="min-w-0 max-w-full space-y-5">
          <section className="min-w-0 max-w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Manuscript File</h3>
              <span className="text-xs font-bold text-[var(--muted)]">{manuscriptFiles.length} file{manuscriptFiles.length === 1 ? '' : 's'}</span>
            </div>
            {manuscriptFiles.length === 0 ? (
              <EmptyState title="No manuscript file">The original manuscript file is not visible to your role right now.</EmptyState>
            ) : (
              <ul className="grid min-w-0 max-w-full gap-2">
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
            <section className="min-w-0 max-w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Workflow Files</h3>
              <ul className="grid min-w-0 max-w-full gap-2">
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
        <div className="mt-5 min-w-0 max-w-full overflow-hidden border-t border-[var(--border)] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Supplementary Assets</h3>
          <div className="mt-3 grid min-w-0 max-w-full gap-4">
            {supplementaryGroups.map((group) => (
              <section key={group.id} className="min-w-0 max-w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <group.icon className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                    <h4 className="truncate text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{group.title}</h4>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[var(--muted)]">{group.items.length} item{group.items.length === 1 ? '' : 's'}</span>
                </div>
                {group.id === 'images' ? (
                  <ImageLightboxGallery images={group.items.map(galleryImage)} title="Images" showHeader={false} />
                ) : (
                  <ul className="grid min-w-0 max-w-full gap-2">
                    {group.items.map(({ kind, item }) => (
                      <DownloadRow
                        key={`${kind}-${item.id}`}
                        item={item}
                        title={assetTitle(item)}
                        meta={assetMeta(kind, item)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </WorkflowSection>
  );
}
