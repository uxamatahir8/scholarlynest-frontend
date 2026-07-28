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

export function withVersionReviewerData(article, data) {
  return {
    ...article,
    reviewer_preferences: data?.reviewer_preferences || { suggested: [], opposed: [] },
    reviewer_assignments: data?.reviewer_assignments || [],
    reviewer_capabilities: data?.capabilities || { manage: false },
    selected_review_round: data?.review_round || 1,
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
