const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  assigned_to_sub_editor: 'Assigned to Sub Editor',
  reviewer_assigned: 'Reviewer Assigned',
  review_in_progress: 'Review in Progress',
  revision_required: 'Revision Required',
  minor_revision_required: 'Minor Revision Required',
  major_revision_required: 'Major Revision Required',
  resubmitted: 'Resubmitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  copy_editing: 'Copy Editing',
  proofreading: 'Proofreading',
  ready_for_publication: 'Ready for Publication',
  published: 'Published',
  completed: 'Completed',
};

const STATUS_TONES = {
  active: 'success',
  completed: 'success',
  accepted: 'success',
  published: 'success',
  pending: 'warning',
  submitted: 'info',
  under_review: 'info',
  assigned_to_sub_editor: 'info',
  reviewer_assigned: 'info',
  review_in_progress: 'info',
  revision_required: 'warning',
  minor_revision_required: 'warning',
  major_revision_required: 'warning',
  resubmitted: 'warning',
  copy_editing: 'info',
  proofreading: 'info',
  ready_for_publication: 'success',
  rejected: 'danger',
  inactive: 'neutral',
  draft: 'neutral',
};

const EDITABLE_ARTICLE_STATUSES = new Set([
  'draft',
  'revision_required',
  'minor_revision_required',
  'major_revision_required',
  'resubmitted',
  'ready_for_publication',
]);

const humanize = (value) => String(value || 'Unknown')
  .replaceAll('-', '_')
  .replaceAll('_', ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

export function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase().replaceAll('-', '_');
}

export function getStatusLabel(status) {
  const normalized = normalizeStatus(status);
  return STATUS_LABELS[normalized] || humanize(status);
}

export function getStatusTone(status) {
  const normalized = normalizeStatus(status);
  return STATUS_TONES[normalized] || 'neutral';
}

export function isArticleEditableStatus(status) {
  return EDITABLE_ARTICLE_STATUSES.has(normalizeStatus(status));
}

export function canEditArticleAtStatus(status) {
  return isArticleEditableStatus(status);
}

export function getWorkflowActionLabel(status, role) {
  const normalized = normalizeStatus(status);
  const normalizedRole = String(role || '').toLowerCase().replaceAll('-', '_');

  if (normalizedRole === 'reviewer' && normalized === 'reviewer_assigned') return 'Accept Review';
  if (normalizedRole === 'reviewer' && normalized === 'review_in_progress') return 'Submit Review';
  if (normalizedRole === 'sub_editor' && normalized === 'assigned_to_sub_editor') return 'Submit Recommendation';
  if (normalizedRole === 'publisher' && normalized === 'ready_for_publication') return 'Publish Article';
  if (normalized === 'draft') return 'Submit Article';
  if (normalized.includes('revision')) return 'Submit Revision';
  return 'Review Next Step';
}

export { EDITABLE_ARTICLE_STATUSES, STATUS_LABELS, STATUS_TONES };
