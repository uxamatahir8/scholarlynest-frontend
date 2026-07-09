'use client';

import React, { useRef, useState } from 'react';
import { Image, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { uploadDirectToS3, pollUploadUntilSettled } from '../../lib/mediaUploads/DirectUploadClient';
import { logError } from '../../utils/safeLogger';

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

export default function ArticleImagesDropzone({ articleId, images = [], queuedImages = [], onQueuedImagesChanged, onImagesChanged }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState({});
  const isBuffered = !articleId;

  const validImage = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !file.type.startsWith('image/')) {
      toast(`"${file.name}" is not a supported article image.`, 'error');
      return false;
    }
    return true;
  };

  const uploadFile = async (file) => {
    const tempId = `${file.name}-${Date.now()}`;
    setUploading((prev) => ({ ...prev, [tempId]: file.name }));
    try {
      const upload = await uploadDirectToS3({ file, purpose: 'article_image', attachableId: articleId });
      const settled = await pollUploadUntilSettled(upload.id);
      if (settled?.status !== 'clean') throw new Error('Image could not be processed.');
      onImagesChanged?.([...images, {
        id: settled.record?.article_asset_id,
        original_filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        asset_type: 'image',
      }]);
      toast(`Article image "${file.name}" uploaded.`, 'success');
    } catch (err) {
      logError('Article image upload failed', err);
      toast('Article image upload failed.', 'error');
    } finally {
      setUploading((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
    }
  };

  const handleFiles = (fileList) => {
    const valid = Array.from(fileList || []).filter(validImage);
    if (isBuffered) {
      onQueuedImagesChanged?.([...queuedImages, ...valid]);
    } else {
      valid.forEach(uploadFile);
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => event.key === 'Enter' && inputRef.current?.click()}
        className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-6 text-center transition hover:border-amber-500"
      >
        <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => handleFiles(event.target.files)} />
        <Upload className="mb-3 h-7 w-7 text-[var(--muted)]" aria-hidden="true" />
        <p className="text-sm font-bold text-[var(--foreground)]">Upload article images or figures</p>
        <p className="mt-1 text-xs text-[var(--muted)]">PNG, JPG, JPEG, or WEBP only.</p>
      </div>

      {(queuedImages.length > 0 || images.length > 0 || Object.keys(uploading).length > 0) && (
        <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          {queuedImages.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 py-2">
              <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <Image className="h-4 w-4 shrink-0 text-amber-600" /> <span className="truncate">{file.name}</span>
              </span>
              <button type="button" onClick={() => onQueuedImagesChanged?.(queuedImages.filter((_, idx) => idx !== index))} className="text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {images.map((image) => (
            <div key={image.id || image.original_filename} className="flex items-center gap-2 py-2 text-sm font-semibold text-[var(--foreground)]">
              <Image className="h-4 w-4 text-amber-600" /> {image.original_filename}
            </div>
          ))}
          {Object.entries(uploading).map(([key, name]) => (
            <div key={key} className="flex items-center gap-2 py-2 text-sm font-semibold text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
