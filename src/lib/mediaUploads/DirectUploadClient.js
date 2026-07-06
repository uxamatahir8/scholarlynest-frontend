'use client';

import api from '../../utils/api';

const RESUME_KEY = 'scholarlynest.mediaUpload.resume.v1';

export function fileFingerprint(file) {
  return [file.name, file.size, file.lastModified].join(':');
}

function readResumeStore() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(RESUME_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeResumeStore(value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RESUME_KEY, JSON.stringify(value));
}

export function rememberUpload(uploadId, metadata) {
  const store = readResumeStore();
  store[uploadId] = metadata;
  writeResumeStore(store);
}

export function forgetUpload(uploadId) {
  const store = readResumeStore();
  delete store[uploadId];
  writeResumeStore(store);
}

async function putWithProgress(url, blob, headers, onProgress, offset = 0, total = blob.size) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    Object.entries(headers || {}).forEach(([key, value]) => {
      if (value) xhr.setRequestHeader(key, value);
    });
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(100, Math.round(((offset + event.loaded) / total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          etag: (xhr.getResponseHeader('ETag') || '').replaceAll('"', ''),
          checksum_sha256: xhr.getResponseHeader('x-amz-checksum-sha256') || null,
        });
      } else {
        reject(new Error('Upload request failed.'));
      }
    };
    xhr.onerror = () => reject(new Error('Upload request failed.'));
    xhr.send(blob);
  });
}

export async function uploadDirectToS3({
  file,
  purpose,
  attachableId,
  extra = {},
  onProgress,
  onState,
}) {
  const fingerprint = fileFingerprint(file);
  onState?.('initiating');

  const initiated = await api.post('/media/uploads/initiate', {
    purpose,
    attachable_id: attachableId,
    original_filename: file.name,
    size_bytes: file.size,
    declared_mime_type: file.type || 'application/octet-stream',
    file_fingerprint: fingerprint,
    ...extra,
  });

  const upload = initiated.data.upload;
  rememberUpload(upload.id, {
    uploadId: upload.id,
    fingerprint,
    fileName: file.name,
    size: file.size,
    lastModified: file.lastModified,
    purpose,
    attachableId,
  });

  if (upload.upload_mode === 'single') {
    onState?.('uploading');
    await putWithProgress(initiated.data.put.url, file, initiated.data.put.headers, onProgress, 0, file.size);
    onState?.('awaiting_scan');
    const completed = await api.post(`/media/uploads/${upload.id}/complete`, {});
    return completed.data.upload;
  }

  const partSize = initiated.data.part_size_bytes || upload.part_size_bytes;
  const totalParts = Math.ceil(file.size / partSize);
  const completedParts = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
    onState?.('uploading');
    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const part = file.slice(start, end);
    const signed = partNumber <= (initiated.data.parts || []).length
      ? initiated.data.parts.find((item) => item.part_number === partNumber)
      : null;
    const partUrl = signed || (await api.post(`/media/uploads/${upload.id}/sign-parts`, {
      part_numbers: [partNumber],
    })).data.parts[0];

    const result = await putWithProgress(partUrl.url, part, partUrl.headers, onProgress, start, file.size);
    completedParts.push({
      part_number: partNumber,
      etag: result.etag,
      checksum_sha256: result.checksum_sha256,
    });

    rememberUpload(upload.id, {
      uploadId: upload.id,
      fingerprint,
      fileName: file.name,
      size: file.size,
      lastModified: file.lastModified,
      purpose,
      attachableId,
      completedParts,
    });
  }

  onState?.('awaiting_scan');
  const completed = await api.post(`/media/uploads/${upload.id}/complete`, {
    parts: completedParts,
  });
  return completed.data.upload;
}

export async function pollUploadUntilSettled(uploadId, onStatus) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await api.get(`/media/uploads/${uploadId}/status`);
    const upload = response.data.upload;
    onStatus?.(upload);
    if (['clean', 'rejected', 'scan_failed', 'aborted', 'expired'].includes(upload.status)) {
      forgetUpload(uploadId);
      return upload;
    }
    await new Promise((resolve) => window.setTimeout(resolve, attempt < 10 ? 2000 : 5000));
  }
  return null;
}

export async function uploadAndAwaitClean(options) {
  const upload = await uploadDirectToS3(options);
  const settled = await pollUploadUntilSettled(upload.id, options.onStatus);
  if (!settled) {
    throw new Error('Upload scan did not finish in time.');
  }
  if (settled.status !== 'clean') {
    throw new Error(settled.failure_reason || 'Upload did not pass security scanning.');
  }
  return settled;
}
