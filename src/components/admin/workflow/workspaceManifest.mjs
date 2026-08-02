export function visibleWorkspaceTabs(manifest) {
  return (manifest?.tabs || []).filter((tab) => tab?.visible !== false && tab?.key && tab?.label);
}

export function initialWorkspaceTab(tabs, requestedThread = false) {
  if (requestedThread && tabs.some((tab) => tab.key === 'communication')) return 'communication';
  return tabs[0]?.key || null;
}

export function firstVisibleSidebarKey(tab) {
  return tab?.sidebar?.find((item) => item.visible !== false)?.key || null;
}

export function workspaceVersionForTab(versions, tab) {
  if (!tab?.version_id) return null;
  const version = (versions || []).find((item) => Number(item.id) === Number(tab.version_id));
  return version ? { ...version, workspace_heading: tab.heading } : null;
}

export const REVIEWER_WORKSPACE_SECTIONS = ['Suggested Reviewers', 'Opposed Reviewers', 'Manual Invitation'];

export function scopeArticleToVersion(article, version, versionTab = null) {
  const versionId = Number(version.id);
  const metadata = version.metadata_snapshot || {};
  const forVersion = (items = []) => items.filter((item) => Number(item.article_version_id) === versionId);
  return {
    ...article,
    ...metadata,
    status: versionTab?.status?.code || version.status_snapshot || 'submitted',
    author_status: versionTab?.status?.label || version.status_snapshot || 'Submitted',
    created_at: versionTab?.submitted_at || version.submitted_at || version.created_at,
    selected_version_status: versionTab?.status || null,
    selected_version_is_current: versionTab?.is_current ?? Number(article.current_version_id) === versionId,
    is_accepted_version: Boolean(versionTab?.is_accepted),
    article_authors: metadata.authors || article.article_authors,
    files: forVersion(article.files),
    versions: [version],
    editorial_decisions: forVersion(article.editorial_decisions),
    sub_editor_assignments: forVersion(article.sub_editor_assignments),
    reviewer_assignments: forVersion(article.reviewer_assignments),
    production_assignments: forVersion(article.production_assignments),
  };
}

export function versionNeedsEditorialScreening(article) {
  const version = article?.versions?.[0];
  if (!version) return false;
  const isCurrent = article?.selected_version_is_current
    ?? Number(article?.current_version_id) === Number(version.id);
  const screeningStatus = article?.selected_version_status?.screening ?? version.screening_status;
  const isInitialSubmission = Number(version.revision_number ?? 0) === 0 && !version.parent_version_id;
  return Boolean(isCurrent && isInitialSubmission && screeningStatus === 'pending');
}

export function withVersionReviewerData(article, data) {
  return {
    ...article,
    reviewer_preferences: data?.reviewer_preferences || { suggested: [], opposed: [] },
    reviewer_assignments: data?.reviewer_assignments || [],
    reviewer_capabilities: data?.capabilities || { manage: false },
    reviewer_round: data?.reviewers || null,
    reviewer_disabled_reason: data?.disabled_reason || data?.reviewers?.disabled_reason || null,
    selected_review_round: data?.review_round || 1,
  };
}

export function reviewerCardAction(reviewer, capabilities = {}) {
  const assignment = reviewer?.existingAssignment;
  const state = assignment?.invitation_state || assignment?.status || reviewer?.state;
  if (!assignment) return reviewer?.previously_completed_review ? 'invite_revision' : 'invite';
  if (['pending', 'invited'].includes(state)) return capabilities.resend ? 'resend' : null;
  if (['declined', 'expired'].includes(state)) return capabilities.reinvite ? 'reinvite' : null;
  if (['accepted', 'in_progress'].includes(state)) return capabilities.reminder ? 'reminder' : 'in_progress';
  if (state === 'completed') return 'completed';
  return null;
}

export function reviewerInvitationScope(article, reviewer = {}) {
  return {
    ...reviewer,
    article_version_id: article?.versions?.[0]?.id,
    review_round_id: article?.reviewer_round?.review_round_id,
    round_number: article?.reviewer_round?.round_number || article?.selected_review_round || 1,
    idempotency_key: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  };
}

export function acceptedManuscriptView(data) {
  return {
    article: data?.article || {},
    publication: data?.publication || null,
    acceptedVersion: data?.accepted_version || null,
    metadata: data?.metadata || {},
    authors: data?.authors || [],
    declarations: data?.declarations || {},
    manuscriptFiles: data?.files?.manuscript || [],
    additionalFiles: data?.files?.additional || [],
    supplementaryFiles: data?.files?.supplementary || [],
    acceptedFileSet: data?.files?.accepted_file_set || null,
  };
}
