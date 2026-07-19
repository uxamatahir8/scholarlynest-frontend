import React, { useState } from 'react';
import { Download, FileImage, Files, Loader2, Sheet } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import ImageLightboxGallery from '../../ui/ImageLightboxGallery';
import WorkflowSection from './WorkflowSection';
import { fileTypeLabels, formatDate, labelize, submissionVersionLabel } from './workflowDisplay';
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

export function fileDownloadUrl(path) {
  if (!path) return '#';
  const apiBase = (api.defaults.baseURL || '').replace(/\/$/, '');
  const suffix = path.startsWith('/api/') ? path.replace(/^\/api/, '') : path;
  let url = path.startsWith('http') ? path : `${apiBase}${suffix}`;

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${token}`;
    }
  }
  return url;
}

export function assetTitle(item) {
  return item.title || item.original_filename || item.original_name || 'Supplementary asset';
}

export function assetMeta(kind, item) {
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

export function supplementaryGroup(kind, item) {
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

export function galleryImage(entry) {
  const item = entry.item;
  return {
    src: fileDownloadUrl(item.download_url),
    title: assetTitle(item),
    caption: item.caption,
    description: item.description,
    alt: assetTitle(item),
  };
}

export function DownloadRow({ item, title, meta }) {
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState('');

  const openFile = () => {
    if (!item.download_url) return;
    setOpenError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
      const apiBase = (api.defaults.baseURL || '').replace(/\/$/, '');
      const rawUrl = item.download_url.startsWith('http')
        ? item.download_url
        : `${apiBase}${item.download_url}`;
      const separator = rawUrl.includes('?') ? '&' : '?';
      const finalUrl = `${rawUrl}${separator}token=${token || ''}`;

      const link = document.createElement('a');
      link.href = finalUrl;
      link.target = '_blank';
      link.download = item.original_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setOpenError('Unable to open this file. Please try again.');
    }
  };

  return (
    <li className="min-w-0 max-w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
      <div className="grid min-w-0 max-w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0 overflow-hidden">
          <p className="max-w-full truncate text-sm font-bold text-[var(--foreground)]" title={title}>{title}</p>
          <p className="mt-1 max-w-full truncate text-xs font-semibold text-[var(--muted)]" title={meta}>{meta}</p>
        </div>
        <button
          type="button"
          onClick={openFile}
          disabled={opening || !item.download_url}
          className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:w-auto"
        >
          {opening ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          {opening ? 'Opening…' : 'Open'}
        </button>
      </div>
      {openError && <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400" role="alert">{openError}</p>}
    </li>
  );
}

export default function ArticleFilesPanel({ files = [], assets = [], versions = [] }) {
  const generalFiles = files.filter((file) => file.file_type !== 'reviewed_manuscript');
  const orderedVersions = [...versions].sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0));
  const fallbackVersionId = orderedVersions.at(-1)?.id;
  const fileForAsset = new Map(generalFiles
    .filter((file) => file.source_asset_id)
    .map((file) => [Number(file.source_asset_id), file]));
  const versionGroups = orderedVersions.map((version) => {
    const versionFiles = generalFiles.filter((file) => Number(file.article_version_id || fallbackVersionId) === Number(version.id));
    const versionAssets = assets.filter((asset) => {
      const sourceFile = fileForAsset.get(Number(asset.id));
      return Number(sourceFile?.article_version_id || fallbackVersionId) === Number(version.id);
    });
    const assetIds = new Set(versionAssets.map((asset) => Number(asset.id)));
    const primaryFiles = versionFiles.filter((file) => !['supplementary', 'additional_manuscript_file'].includes(file.file_type));
    const supplementaryItems = [
      ...versionFiles
        .filter((file) => file.file_type === 'supplementary' && !assetIds.has(Number(file.source_asset_id)))
        .map((file) => ({ kind: 'file', item: file })),
      ...versionAssets.map((asset) => ({ kind: 'asset', item: asset })),
    ];
    const grouped = supplementaryItems.reduce((groups, entry) => {
      groups[supplementaryGroup(entry.kind, entry.item)].push(entry);
      return groups;
    }, { images: [], sheets: [], files: [] });
    return { version, primaryFiles, grouped };
  }).filter((group) => group.primaryFiles.length > 0 || Object.values(group.grouped).some((items) => items.length > 0));

  return (
    <WorkflowSection
      title="Files"
      description="Files available through the existing secured download routes."
      icon={Download}
      aside={<span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{generalFiles.length} visible</span>}
    >
      {versionGroups.length === 0 ? (
        <EmptyState title="No visible files">No manuscript files are available to your role right now.</EmptyState>
      ) : (
        <div className="min-w-0 max-w-full space-y-5">
          {versionGroups.map(({ version, primaryFiles, grouped }, index) => {
            const supplementaryGroups = [
              { id: 'images', title: 'Images', icon: FileImage, items: grouped.images },
              { id: 'sheets', title: 'Sheets and Data', icon: Sheet, items: grouped.sheets },
              { id: 'files', title: 'Supplementary Files', icon: Files, items: grouped.files },
            ].filter((group) => group.items.length > 0);
            return (
              <section key={version.id} className="min-w-0 max-w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">{submissionVersionLabel(version)}</h3>
                    <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                      {version.revision_tracking_code || submissionVersionLabel(version)} · {formatDate(version.created_at)}
                    </p>
                  </div>
                  {index === 0 && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">Latest</span>}
                </div>
                <div className="space-y-4">
                  {primaryFiles.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Manuscript and Response Files</h4>
                      <ul className="grid min-w-0 max-w-full gap-2">
                        {primaryFiles.map((file) => (
                          <DownloadRow key={file.id} item={file} title={file.original_name || fileTypeLabels[file.file_type] || 'File'} meta={`${fileTypeLabels[file.file_type] || labelize(file.file_type)} · ${formatDate(file.created_at)}`} />
                        ))}
                      </ul>
                    </div>
                  )}
                  {supplementaryGroups.map((group) => (
                    <div key={group.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <group.icon className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{group.title}</h4>
                      </div>
                      {group.id === 'images' ? (
                        <ImageLightboxGallery images={group.items.map(galleryImage)} title="Images" showHeader={false} />
                      ) : (
                        <ul className="grid min-w-0 max-w-full gap-2">
                          {group.items.map(({ kind, item }) => (
                            <DownloadRow key={`${kind}-${item.id}`} item={item} title={assetTitle(item)} meta={assetMeta(kind, item)} />
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </WorkflowSection>
  );
}
