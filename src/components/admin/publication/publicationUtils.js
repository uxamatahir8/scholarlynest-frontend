export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const issueStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'unpublished', label: 'Unpublished' },
];

export function friendlyStatus(status) {
  const normalized = String(status || 'draft').replaceAll('-', '_').toLowerCase();
  const labels = {
    draft: 'Draft',
    unpublished: 'Unpublished',
    published: 'Published',
    accepted: 'Accepted',
    ready_for_publication: 'Ready for Publication',
    approved: 'Approved',
  };
  return labels[normalized] || normalized.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function statusTone(status) {
  const normalized = String(status || '').replaceAll('-', '_').toLowerCase();
  if (normalized === 'published') return 'emerald';
  if (normalized === 'ready_for_publication' || normalized === 'accepted' || normalized === 'approved') return 'amber';
  if (normalized === 'unpublished') return 'zinc';
  return 'blue';
}

export function issueLabel(issue) {
  if (!issue) return 'Issue not selected';
  const volume = issue.volume_number ? `Vol. ${issue.volume_number}` : 'Volume TBD';
  const number = issue.issue_number ? `Issue ${issue.issue_number}` : 'Issue TBD';
  return `${volume}, ${number}`;
}

export function issueDate(issue) {
  if (!issue) return 'Publication timing not set';
  const parts = [issue.issue_month, issue.issue_year].filter(Boolean);
  if (parts.length) return parts.join(' ');
  if (issue.published_at) {
    try {
      return new Date(issue.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Publication date recorded';
    }
  }
  return 'Publication timing not set';
}

export function authorsLine(article) {
  const authors = article?.article_authors || article?.articleAuthors || [];
  const names = authors
    .map((author) => author.co_author_name || author.name)
    .filter(Boolean);
  return names.length ? names.join(', ') : 'Authors not listed';
}

export function compactText(value, fallback = 'No description provided.') {
  const text = String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || fallback;
}
