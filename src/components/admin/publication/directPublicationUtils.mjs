export function directPublicationIssueLabel(issue) {
  const base = `Volume ${issue.volume_number}, Issue ${issue.issue_number}`;
  const title = issue.special_title ? ` — ${issue.special_title}` : '';
  const status = String(issue.status || 'draft').replaceAll('_', ' ');
  return `${base}${title} (${status})`;
}

export function boundedDirectPublicationStep(value, stepCount) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return Math.min(parsed, Math.max(0, stepCount - 1));
}

export function restoredDirectPublicationStep({ requestedStep, savedStep, status, stepCount }) {
  if (requestedStep !== null && requestedStep !== undefined && requestedStep !== '') {
    return boundedDirectPublicationStep(requestedStep, stepCount);
  }
  if (!status || status === 'direct_publication_draft') {
    return boundedDirectPublicationStep(savedStep, stepCount);
  }
  return 0;
}

export function getOrCreateDraftOperation(storage, storageKey, payload, keyFactory) {
  let existing = null;
  try { existing = JSON.parse(storage.getItem(storageKey) || 'null'); } catch { existing = null; }
  if (existing?.key && existing?.payload) return existing;
  const operation = { key: keyFactory(), payload };
  storage.setItem(storageKey, JSON.stringify(operation));
  return operation;
}

export function canStartDirectPublicationUpload({ magazineId, title, status, purpose }) {
  if (!magazineId || !String(title || '').trim()) return false;
  return status !== 'published' || purpose === 'direct_publication_manuscript';
}

export function isMultiFileDirectPublicationPurpose(purpose) {
  return ['direct_publication_figure', 'direct_publication_supplementary'].includes(purpose);
}

export function selectedDirectPublicationFiles(fileList, purpose) {
  const files = Array.from(fileList || []);
  return isMultiFileDirectPublicationPurpose(purpose) ? files : files.slice(0, 1);
}
