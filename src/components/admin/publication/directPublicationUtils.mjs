export function directPublicationIssueLabel(issue) {
  const base = `Volume ${issue.volume_number}, Issue ${issue.issue_number}`;
  const title = issue.special_title ? ` — ${issue.special_title}` : '';
  const status = String(issue.status || 'draft').replaceAll('_', ' ');
  return `${base}${title} (${status})`;
}
