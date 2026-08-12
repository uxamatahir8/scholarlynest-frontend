import { getRoleDisplayName, normalizeRoleName } from '../../../utils/roles';
import { getStatusLabel, normalizeStatus } from '../../../utils/status';

export const workflowMilestones = [
  { id: 'draft', label: 'Draft', statuses: ['draft'] },
  { id: 'submitted', label: 'Submitted', statuses: ['submitted', 'pending', 'awaiting_initial_screening'] },
  { id: 'transfer_pending', label: 'Transfer pending author decision', statuses: ['in_transit', 'transfer_requested'] },
  { id: 'screening', label: 'Editorial screening', statuses: ['screening', 'screening_completed', 'awaiting_sub_editor_assignment', 'awaiting_reviewer_invitation'] },
  { id: 'sub_editor', label: 'Sub Editor review', statuses: ['assigned_to_sub_editor', 'awaiting_sub_editor_recommendation'] },
  { id: 'review', label: 'Peer review', statuses: ['under_review', 'reviewer_assigned', 'review_in_progress', 'reviewer_invitations_pending', 'reviews_partially_completed', 'reviews_completed', 'awaiting_editorial_decision'] },
  { id: 'revision', label: 'Revision', statuses: ['revision_required', 'minor_revision_required', 'major_revision_required', 'resubmitted', 'minor_revision_requested', 'major_revision_requested', 'awaiting_author_revision', 'revision_submitted'] },
  { id: 'accepted', label: 'Accepted', statuses: ['accepted', 'approved'] },
  { id: 'copy_editing', label: 'Copyediting', statuses: ['copy_editing', 'awaiting_copy_editor_assignment', 'copyediting_in_progress'] },
  { id: 'proofreading', label: 'Proofreading', statuses: ['proofreading', 'awaiting_author_proofreading', 'proof_corrections_in_progress', 'proof_approved'] },
  { id: 'ready', label: 'Ready for publication', statuses: ['ready_for_publication', 'awaiting_issue_assignment', 'assigned_to_issue', 'scheduled_for_publication'] },
  { id: 'published', label: 'Published', statuses: ['published', 'unpublished'] },
];

export const fileTypeLabels = {
  manuscript: 'Original Manuscript',
  supplementary: 'Supplementary File',
  plagiarism_report: 'Similarity Report',
  annotated_manuscript: 'Annotated Manuscript',
  reviewed_manuscript: 'Reviewed Manuscript',
  revision_response: 'Response to Revision Request',
  additional_manuscript_file: 'Additional Manuscript File',
  copy_edited_file: 'Copyedited Manuscript',
  proof_file: 'Proof File',
  publication_pdf: 'Published PDF',
};

export function formatDate(value, options = {}) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

export function labelize(value) {
  return String(value || 'Not recorded').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function submissionVersionLabel(version) {
  const versionNumber = Number(version?.version_number);
  const revisionNumber = Number(version?.revision_number);
  if (revisionNumber === 0 || (version?.revision_number == null && versionNumber === 1)) return 'Initial Submission';
  if (Number.isFinite(revisionNumber) && revisionNumber > 0) return `R${revisionNumber}`;

  return version?.label || (Number.isFinite(versionNumber) ? `Version ${versionNumber}` : 'Version');
}

export function hasAcceptedReviewInvitation(assignment) {
  if (!assignment || assignment.declined_at || assignment.invitation_state === 'declined') return false;

  return Boolean(assignment.accepted_at || assignment.completed_at)
    || ['accepted', 'completed'].includes(assignment.invitation_state)
    || ['accepted', 'in_progress', 'completed'].includes(assignment.status);
}

export function currentMilestoneIndex(status) {
  const normalized = normalizeStatus(status);
  const index = workflowMilestones.findIndex((milestone) => milestone.statuses.includes(normalized));
  return index < 0 ? 0 : index;
}

export function roleContext(user) {
  return getRoleDisplayName(user || {});
}

export function isAuthorViewer(user, article) {
  if (!user || !article) return false;
  if (Number(article.user_id) === Number(user.id)) return true;
  return (article.article_authors || []).some((author) => (
    Number(author.user_id) === Number(user.id)
    || String(author.co_author_email || '').toLowerCase() === String(user.email || '').toLowerCase()
  ));
}

export function canViewReviewerIdentity(user, hasRole) {
  return hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('sub_editor');
}

export function eventLabel(event) {
  const labels = {
    'article.submitted': 'Manuscript submitted',
    'article.created': 'Manuscript created',
    'article.screened': 'Editorial screening completed',
    'sub_editor.assigned': 'Assigned to Sub Editor',
    'reviewer.assigned': 'Review requested',
    'sub_editor.recommendation_submitted': 'Sub Editor recommendation submitted',
    'review.accepted': 'Review invitation accepted',
    'review.submitted': 'Review completed',
    'review.reopened': 'Review reopened',
    'editorial.decision': 'Editorial decision recorded',
    'revision.requested': 'Revision requested',
    'article.accepted': 'Manuscript accepted',
    'article.rejected': 'Manuscript rejected',
    'production.assigned': 'Production assignment created',
    'production.completed': 'Production task completed',
    'article.ready_for_publication': 'Ready for publication',
    'article.published': 'Published',
    'post_publication.recorded': 'Post-publication action recorded',
  };

  if (labels[event]) return labels[event];
  if (String(event || '').startsWith('post_publication.')) return 'Post-publication action recorded';
  return labelize(event);
}

export function statusSentence(status) {
  return getStatusLabel(status);
}

const activeProductionAssignmentStatuses = new Set(['active', 'pending', 'in_progress', 'assigned']);

export function nextStepText(article, user, hasRole) {
  const status = normalizeStatus(article?.status);
  if (hasRole('reviewer')) {
    const own = (article?.reviewer_assignments || []).find((item) => Number(item.reviewer_id) === Number(user?.id));
    if (own?.status === 'pending') return 'Accept the review invitation to begin your review.';
    if (own && own.status !== 'completed') return 'Submit your review recommendation and author-facing comments.';
  }
  if (hasRole('sub_editor')) {
    const own = (article?.sub_editor_assignments || []).find((item) => Number(item.sub_editor_id) === Number(user?.id));
    if (own && own.status !== 'completed') return 'Review the manuscript and submit your recommendation to the Editor.';
  }
  if (hasRole('copy_editor')) {
    const own = (article?.production_assignments || []).find((item) => Number(item.user_id) === Number(user?.id) && item.role === 'copy_editor');
    if (own?.status === 'completed') return 'Your copyediting task is complete. Review the manuscript record if needed.';
    if (own && activeProductionAssignmentStatuses.has(own.status)) return 'Open the manuscript files, upload a copyedited manuscript if needed, then mark copyediting complete.';
    return 'No copyediting action is assigned to you for this manuscript right now.';
  }
  if (hasRole('proofreader')) {
    const own = (article?.production_assignments || []).find((item) => Number(item.user_id) === Number(user?.id) && item.role === 'proofreader');
    if (own?.status === 'completed') return 'Your proofreading task is complete. Review the manuscript record if needed.';
    if (own && activeProductionAssignmentStatuses.has(own.status)) return 'Open the manuscript files, upload a proof file if needed, then mark proofreading complete.';
    return 'No proofreading action is assigned to you for this manuscript right now.';
  }
  if (hasRole('publisher') && ['accepted', 'ready_for_publication'].includes(status)) return 'Prepare publication metadata and issue placement.';
  if (hasRole('editor') || hasRole('super_admin') || hasRole('admin')) {
    if (['submitted', 'pending', 'screening'].includes(status)) return 'Complete editorial screening.';
    if (['under_review', 'assigned_to_sub_editor', 'reviewer_assigned', 'review_in_progress', 'resubmitted'].includes(status)) return 'Continue editorial review or record a decision.';
    if (status === 'accepted') return 'Move the manuscript into production when ready.';
  }
  return 'Review the permitted manuscript status and history.';
}
