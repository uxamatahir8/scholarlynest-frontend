export const ARTICLE_QUEUE_PARAM = 'queue';

export const ARTICLE_QUEUES = {
  all: {
    id: 'all',
    label: 'All',
    heading: 'All Manuscripts',
    description: 'All article records visible to your current role.',
    statuses: [],
  },
  submitted: {
    id: 'submitted',
    label: 'Submitted',
    heading: 'Articles Requiring Attention',
    description: 'Submitted manuscripts waiting for initial editorial screening.',
    statuses: ['submitted', 'screening'],
  },
  'active-review': {
    id: 'active-review',
    label: 'Active Review',
    heading: 'Active Review Work',
    description: 'Manuscripts moving through editorial review and reviewer follow-up.',
    statuses: ['under_review', 'assigned_to_sub_editor', 'reviewer_assigned', 'review_in_progress'],
  },
  'revision-follow-up': {
    id: 'revision-follow-up',
    label: 'Revision Follow-up',
    heading: 'Revision Follow-up',
    description: 'Manuscripts requiring author revision or resubmission follow-up.',
    statuses: ['revision_required', 'minor_revision_required', 'major_revision_required', 'resubmitted'],
  },
  drafts: {
    id: 'drafts',
    label: 'Drafts',
    heading: 'Draft Manuscripts',
    description: 'Draft manuscripts visible to your current role.',
    statuses: ['draft'],
  },
  published: {
    id: 'published',
    label: 'Published',
    heading: 'Published Manuscripts',
    description: 'Published article records visible to your current role.',
    statuses: ['published'],
  },
  accepted: {
    id: 'accepted',
    label: 'Accepted',
    heading: 'Accepted Manuscripts',
    description: 'Accepted manuscripts visible to your current role.',
    statuses: ['accepted'],
  },
  ready: {
    id: 'ready',
    label: 'Ready',
    heading: 'Ready for Publication',
    description: 'Manuscripts ready for publication handling.',
    statuses: ['ready_for_publication'],
  },
  rejected: {
    id: 'rejected',
    label: 'Rejected',
    heading: 'Rejected Manuscripts',
    description: 'Rejected article records visible to your current role.',
    statuses: ['rejected'],
  },
};

export const DEFAULT_ARTICLE_QUEUE_ID = 'all';

export const ARTICLE_QUEUE_TABS = [
  ARTICLE_QUEUES.all,
  ARTICLE_QUEUES.drafts,
  ARTICLE_QUEUES.submitted,
  ARTICLE_QUEUES['active-review'],
  ARTICLE_QUEUES['revision-follow-up'],
  ARTICLE_QUEUES.accepted,
  ARTICLE_QUEUES.ready,
  ARTICLE_QUEUES.published,
  ARTICLE_QUEUES.rejected,
];

export function getArticleQueue(queueId) {
  return ARTICLE_QUEUES[queueId] || ARTICLE_QUEUES[DEFAULT_ARTICLE_QUEUE_ID];
}

export function isValidArticleQueue(queueId) {
  return Boolean(ARTICLE_QUEUES[queueId]);
}

export function articleQueueHref(queueId) {
  const queue = getArticleQueue(queueId);
  return queue.id === DEFAULT_ARTICLE_QUEUE_ID ? '/admin/articles' : `/admin/articles?${ARTICLE_QUEUE_PARAM}=${queue.id}`;
}
