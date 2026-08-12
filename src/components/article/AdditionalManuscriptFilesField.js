'use client';

import { useRef } from 'react';
import { CheckCircle2, FileText, Loader2, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import api from '../../utils/api';
import { getUploadErrorMessage, uploadAndAwaitClean } from '../../lib/mediaUploads/DirectUploadClient';

const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const newRow = () => ({ clientId: crypto.randomUUID(), fileTitle: '', file: null, uploadId: null, articleFileId: null, fileName: '', status: 'idle', progress: 0, error: '' });

export { newRow as createAdditionalManuscriptFileRow };

export default function AdditionalManuscriptFilesField({ rows, onChange, articleId = null, disabled = false, heading = 'Additional Manuscript Files' }) {
  const rowsRef = useRef(rows);
  const uploadLocks = useRef(new Set());
  rowsRef.current = rows;
  const canAddRow = rows.length === 0 || rows.every((row) => row.fileTitle.trim() && row.status === 'uploaded');

  const patchRow = (clientId, patch) => onChange(rowsRef.current.map((row) => row.clientId === clientId ? { ...row, ...patch } : row));

  const uploadRow = async (row, selectedFile = row.file) => {
    if (uploadLocks.current.has(row.clientId)) return;
    if (!row.fileTitle.trim()) {
      patchRow(row.clientId, { file: selectedFile, fileName: selectedFile?.name || row.fileName, status: 'failed', error: 'File Title is required before upload.' });
      return;
    }
    if (!selectedFile) {
      patchRow(row.clientId, { status: 'failed', error: 'Select file again.' });
      return;
    }
    if (['uploading', 'uploaded'].includes(row.status)) return;

    if (articleId && row.status === 'failed' && row.articleFileId) {
      try {
        await api.delete(`/articles/${articleId}/additional-manuscript-files/${row.articleFileId}`);
      } catch (error) {
        patchRow(row.clientId, { error: getUploadErrorMessage(error) });
        return;
      }
    }

    uploadLocks.current.add(row.clientId);
    patchRow(row.clientId, { file: selectedFile, fileName: selectedFile.name, uploadId: null, articleFileId: null, status: 'uploading', progress: 0, error: '' });
    try {
      const upload = await uploadAndAwaitClean({
        file: selectedFile,
        purpose: 'additional_manuscript_file',
        attachableId: articleId || undefined,
        clientUploadId: row.clientId,
        extra: { file_title: row.fileTitle.trim() },
        onProgress: (progress) => patchRow(row.clientId, { progress }),
      });
      patchRow(row.clientId, {
        uploadId: upload.id,
        articleFileId: upload.record?.article_file_id || null,
        status: 'uploaded',
        progress: 100,
        error: '',
      });
    } catch (error) {
      patchRow(row.clientId, {
        status: 'failed',
        uploadId: error?.upload?.id || null,
        articleFileId: error?.upload?.record?.article_file_id || null,
        error: getUploadErrorMessage(error),
      });
    } finally {
      uploadLocks.current.delete(row.clientId);
    }
  };

  const removeRow = async (row) => {
    patchRow(row.clientId, { status: 'removing', error: '' });
    try {
      if (articleId && row.articleFileId) {
        await api.delete(`/articles/${articleId}/additional-manuscript-files/${row.articleFileId}`);
      }
      onChange(rowsRef.current.filter((item) => item.clientId !== row.clientId));
    } catch (error) {
      patchRow(row.clientId, { status: 'uploaded', error: getUploadErrorMessage(error) });
    }
  };

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5" aria-labelledby="additional-manuscript-files-heading">
      <h3 id="additional-manuscript-files-heading" className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">{heading}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Add supporting files such as a cover letter, author declaration, ethics approval, graphical abstract, dataset description, or other manuscript-related documents.</p>

      <div className="mt-4 space-y-4">
        {rows.map((row) => {
          const locked = row.status === 'uploaded' || row.status === 'removing';
          return (
            <div key={row.clientId} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                <label className="text-sm font-bold text-[var(--foreground)]">
                  File Title
                  <input value={row.fileTitle} maxLength={255} disabled={locked || disabled} onChange={(event) => patchRow(row.clientId, { fileTitle: event.target.value, error: '' })} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500" />
                </label>
                <div>
                  <span className="text-sm font-bold text-[var(--foreground)]">Choose File</span>
                  {locked ? (
                    <div className="mt-2 flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold"><FileText className="h-4 w-4" /><span className="truncate">{row.fileName}</span></div>
                  ) : (
                    <label className="mt-2 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-bold hover:bg-[var(--surface-muted)]">
                      <Upload className="h-4 w-4" /> Choose File
                      <input className="sr-only" type="file" accept={ACCEPT} disabled={disabled || row.status === 'uploading'} onChange={(event) => uploadRow(row, event.target.files?.[0])} />
                    </label>
                  )}
                </div>
                <button type="button" disabled={disabled || row.status === 'uploading' || row.status === 'removing'} onClick={() => removeRow(row)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold text-red-600 hover:bg-red-500/10 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Remove</button>
              </div>
              <div className="mt-3 text-sm font-semibold" aria-live="polite">
                {row.status === 'uploading' && <span className="inline-flex items-center gap-2 text-amber-700"><Loader2 className="h-4 w-4 animate-spin" /> Uploading… {row.progress}%</span>}
                {row.status === 'uploaded' && <span className="inline-flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Uploaded</span>}
                {row.status === 'failed' && <div className="flex flex-wrap items-center gap-3"><span className="text-red-600">Upload failed: {row.error}</span><button type="button" onClick={() => uploadRow(row)} className="inline-flex items-center gap-1 font-bold text-amber-700 hover:underline"><RefreshCw className="h-4 w-4" /> Retry Upload</button></div>}
                {row.error && row.status !== 'failed' && <span className="text-red-600">{row.error}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        disabled={disabled || !canAddRow}
        onClick={() => {
          if (canAddRow) onChange([...rows, newRow()]);
        }}
        title={!canAddRow ? 'Complete the current file before adding another.' : undefined}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" /> Add File
      </button>
      {!canAddRow && <p className="mt-2 text-xs font-semibold text-[var(--muted)]">Complete the current file before adding another.</p>}
    </section>
  );
}
