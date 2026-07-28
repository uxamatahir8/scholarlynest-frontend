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
