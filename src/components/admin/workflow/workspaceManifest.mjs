export function visibleWorkspaceTabs(manifest) {
  return (manifest?.tabs || []).filter((tab) => tab?.visible !== false && tab?.key && tab?.label);
}

export function initialWorkspaceTab(tabs, requestedThread = false) {
  if (requestedThread && tabs.some((tab) => tab.key === 'communication')) return 'communication';
  return tabs[0]?.key || null;
}

export function scopeArticleToVersion(article, version) {
  const versionId = Number(version.id);
  const metadata = version.metadata_snapshot || {};
  const forVersion = (items = []) => items.filter((item) => Number(item.article_version_id) === versionId);
  return {
    ...article,
    ...metadata,
    article_authors: metadata.authors || article.article_authors,
    files: forVersion(article.files),
    versions: [version],
    editorial_decisions: forVersion(article.editorial_decisions),
    sub_editor_assignments: forVersion(article.sub_editor_assignments),
    reviewer_assignments: forVersion(article.reviewer_assignments),
    production_assignments: forVersion(article.production_assignments),
  };
}
