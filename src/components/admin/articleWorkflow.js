export const STATUS_META = {
  draft: ['Draft', 'zinc'],
  pending: ['Submitted', 'blue'],
  submitted: ['Submitted', 'blue'],
  in_transit: ['In Transit', 'amber'],
  under_review: ['Under Review', 'indigo'],
  assigned_to_sub_editor: ['Assigned to Sub Editor', 'violet'],
  reviewer_assigned: ['Reviewer Assigned', 'cyan'],
  review_in_progress: ['Review in Progress', 'cyan'],
  revision_required: ['Revision Required', 'amber'],
  minor_revision_required: ['Minor Revision Required', 'amber'],
  major_revision_required: ['Major Revision Required', 'orange'],
  minor_review_rejected: ['Revision Required', 'amber'],
  resubmitted: ['Resubmitted', 'sky'],
  approved: ['Accepted', 'emerald'],
  accepted: ['Accepted', 'emerald'],
  rejected: ['Rejected', 'red'],
  fully_rejected: ['Rejected', 'red'],
  copy_editing: ['Copy Editing', 'teal'],
  proofreading: ['Proofreading', 'teal'],
  ready_for_publication: ['Ready for Publication', 'purple'],
  published: ['Published', 'purple'],
  withdrawn: ['Withdrawn', 'zinc'],
  archived: ['Archived', 'zinc'],
};

export const STATUS_TONE_CLASSES = {
  amber: 'bg-amber-500/[0.04] text-amber-600 border-amber-500/10',
  blue: 'bg-blue-500/[0.04] text-blue-600 border-blue-500/10',
  cyan: 'bg-cyan-500/[0.04] text-cyan-600 border-cyan-500/10',
  emerald: 'bg-emerald-500/[0.04] text-emerald-600 border-emerald-500/10',
  indigo: 'bg-indigo-500/[0.04] text-indigo-600 border-indigo-500/10',
  orange: 'bg-orange-500/[0.04] text-orange-600 border-orange-500/10',
  purple: 'bg-purple-500/[0.04] text-purple-600 border-purple-500/10',
  red: 'bg-red-500/[0.04] text-red-500 border-red-500/10',
  sky: 'bg-sky-500/[0.04] text-sky-600 border-sky-500/10',
  teal: 'bg-teal-500/[0.04] text-teal-600 border-teal-500/10',
  violet: 'bg-violet-500/[0.04] text-violet-600 border-violet-500/10',
  zinc: 'bg-zinc-500/[0.04] text-zinc-500 border-zinc-500/10',
};

export const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'assigned_to_sub_editor', label: 'Sub Editor' },
  { id: 'reviewer_assigned', label: 'Reviewer' },
  { id: 'review_in_progress', label: 'In Review' },
  { id: 'revision_required', label: 'Revisions' },
  { id: 'resubmitted', label: 'Resubmitted' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'ready_for_publication', label: 'Ready' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
];

export const EDITABLE_STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'published', label: 'Published' },
  { value: 'revision_required', label: 'Revision Required' },
  { value: 'minor_revision_required', label: 'Minor Revision Required' },
  { value: 'major_revision_required', label: 'Major Revision Required' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resubmitted', label: 'Resubmitted' },
];

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_META).map(([status, [label]]) => [status, label])
);

export const REVIEWABLE_STATUSES = new Set([
  'pending',
  'submitted',
  'under_review',
  'assigned_to_sub_editor',
  'reviewer_assigned',
  'review_in_progress',
  'resubmitted',
]);

export const REVISION_STATUSES = new Set([
  'revision_required',
  'minor_revision_required',
  'major_revision_required',
  'minor_review_rejected',
]);

export const REJECTED_STATUSES = new Set(['rejected', 'fully_rejected']);
export const PUBLISHABLE_STATUSES = new Set(['approved', 'accepted', 'ready_for_publication']);

export function normalizeRoleName(roleName) {
  return String(roleName || '').replaceAll('-', '_');
}

export function roleRequiresMagazineAssignment(roleName) {
  return ['editor', 'magazine_editor', 'publisher', 'proofreader'].includes(normalizeRoleName(roleName));
}
