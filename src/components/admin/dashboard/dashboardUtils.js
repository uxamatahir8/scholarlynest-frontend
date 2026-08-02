export const completedAssignmentStatuses = new Set(['completed']);

export function articleQueueItem(article, actionLabel = 'Open Article') {
  return {
    id: article.id,
    title: article.title,
    status: article.author_status || article.status,
    context: article.magazine?.title || article.user?.name || 'Manuscript record',
    href: article.id ? `/admin/articles/${article.id}/workflow` : '/admin/articles',
    trackingCode: article.latest_tracking_code || article.tracking_code,
    actionLabel,
  };
}

export function assignmentQueueItem(assignment, actionLabel = 'Open Task') {
  const article = assignment.article || {};
  let primaryActionLabel = actionLabel;

  if (assignment.primary_action === 'continue_screening') primaryActionLabel = 'Continue Screening';
  else if (assignment.primary_action === 'manage_reviewers') primaryActionLabel = 'Manage Reviewers';
  else if (assignment.primary_action === 'review_reviewer_progress') primaryActionLabel = 'Review Reviewer Progress';
  else if (assignment.primary_action === 'submit_recommendation') primaryActionLabel = 'Submit Recommendation';
  else if (assignment.primary_action === 'accept_decline') primaryActionLabel = 'Accept / Decline Invitation';
  else if (assignment.primary_action === 'start_review') primaryActionLabel = 'Start Review';
  else if (assignment.primary_action === 'continue_review') primaryActionLabel = 'Continue Review';
  else if (assignment.primary_action === 'view_submitted_review') primaryActionLabel = 'View Submitted Review';
  else if (assignment.primary_action === 'view_recommendation') primaryActionLabel = 'View Recommendation';

  let displayStatus = assignment.status || article.status;
  if (displayStatus === 'accepted') {
    displayStatus = 'awaiting_review';
  }

  let href = article.id ? `/admin/articles/${article.id}/workflow` : undefined;
  if (assignment.primary_action === 'accept_decline') {
    href = '/admin/reviewer?status=pending';
  } else if (['start_review', 'continue_review', 'view_submitted_review'].includes(assignment.primary_action)) {
    href = '/admin/reviewer';
  }

  return {
    id: assignment.id,
    title: article.title,
    status: displayStatus,
    context: article.magazine?.title || 'Assigned manuscript',
    dueDate: assignment.due_date,
    assigneeName: assignment.assignee?.name,
    href,
    trackingCode: article.latest_tracking_code || article.tracking_code,
    actionLabel: primaryActionLabel,
  };
}

export function publicationQueueItem(article, actionLabel = 'Open Publishing') {
  const issue = article.issue;
  const issueLabel = issue
    ? [issue.volume_number ? `Vol. ${issue.volume_number}` : null, issue.issue_number ? `Issue ${issue.issue_number}` : null].filter(Boolean).join(', ')
    : null;

  return {
    id: article.id,
    title: article.title,
    status: article.status,
    context: [article.magazine?.title, issueLabel].filter(Boolean).join(' / ') || 'Publication record',
    href: article.id ? `/admin/articles/${article.id}/workflow` : '/admin/publisher',
    trackingCode: article.latest_tracking_code || article.tracking_code,
    actionLabel,
  };
}

const TOOL_DESCRIPTIONS = {
  '/admin/users': 'Manage authorized console accounts.',
  '/admin/articles': 'Open the full manuscript queue.',
  '/admin/magazines': 'Review publication catalog records.',
  '/admin/cms/faqs': 'Maintain public help content.',
  '/admin/newsletter': 'Open newsletter communications.',
  '/admin/settings': 'Manage account and security settings.',
  '/admin/editor/sub-editors': 'Manage assigned sub-editor relationships.',
  '/admin/issues': 'Manage issue records and publication placement.',
  '/admin/sub-editor': 'Open your assigned recommendation desk.',
  '/admin/reviewer': 'Open your assigned review desk.',
  '/admin/copy-editor': 'Open your copyediting assignments.',
  '/admin/proofreader': 'Open your proofing assignments.',
  '/admin/publisher': 'Open publication-ready work.',
  '/admin/articles/new': 'Start a manuscript submission.',
};

export function dashboardLinksFromNavigation(navigation, preferredHrefs = [], limit = 6) {
  const items = navigation.flatMap((section) => section.items);
  const byHref = new Map(items.map((item) => [item.href, item]));
  const preferred = preferredHrefs.map((href) => byHref.get(href)).filter(Boolean);
  const fallback = items.filter((item) => !preferredHrefs.includes(item.href));

  return [...preferred, ...fallback].slice(0, limit).map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    description: TOOL_DESCRIPTIONS[item.href],
  }));
}
