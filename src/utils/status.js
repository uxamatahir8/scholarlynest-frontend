const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  draft: 'Draft',
  submitted: 'Submitted',
  screening: 'Screening',
  in_transit: 'In Transit',
  under_review: 'Under Review',
  assigned_to_sub_editor: 'Assigned to Sub Editor',
  reviewer_assigned: 'Reviewer Assigned',
  review_in_progress: 'Review in Progress',
  revision_required: 'Revision Required',
  minor_revision_required: 'Minor Revision Required',
  major_revision_required: 'Major Revision Required',
  resubmitted: 'Resubmitted',
  accepted: 'Accepted',
  awaiting_review: 'Awaiting Review',
  rejected: 'Rejected',
  copy_editing: 'Copy Editing',
  proofreading: 'Proofreading',
  ready_for_publication: 'Ready for Publication',
  published: 'Published',
  awaiting_initial_screening: 'Awaiting Initial Screening',
  transfer_requested: 'Transfer Requested',
  desk_rejected: 'Desk Rejected',
  screening_completed: 'Screening Completed',
  awaiting_sub_editor_assignment: 'Awaiting Sub-editor Assignment',
  awaiting_reviewer_invitation: 'Awaiting Reviewer Invitation',
  reviewer_invitations_pending: 'Reviewer Invitations Pending',
  reviews_partially_completed: 'Reviews Partially Completed',
  reviews_completed: 'Reviews Completed',
  awaiting_sub_editor_recommendation: 'Awaiting Sub-editor Recommendation',
  awaiting_editorial_decision: 'Awaiting Editorial Decision',
  minor_revision_requested: 'Minor Revision Requested',
  major_revision_requested: 'Major Revision Requested',
  awaiting_author_revision: 'Awaiting Author Revision',
  revision_submitted: 'Revision Submitted',
  awaiting_copy_editor_assignment: 'Awaiting Copy Editor Assignment',
  copyediting_in_progress: 'Copyediting In Progress',
  awaiting_author_proofreading: 'Awaiting Author Proofreading',
  proof_corrections_in_progress: 'Proof Corrections In Progress',
  proof_approved: 'Proof Approved',
  awaiting_issue_assignment: 'Awaiting Issue Assignment',
  assigned_to_issue: 'Assigned to Issue',
  scheduled_for_publication: 'Scheduled for Publication',
  unpublished: 'Unpublished',
  completed: 'Completed',
};

const STATUS_TONES = {
  active: 'success',
  completed: 'success',
  accepted: 'success',
  awaiting_review: 'success',
  published: 'success',
  pending: 'warning',
  submitted: 'info',
  screening: 'info',
  in_transit: 'warning',
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
