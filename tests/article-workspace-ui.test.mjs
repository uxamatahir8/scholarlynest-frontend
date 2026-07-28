import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptedManuscriptView, firstVisibleSidebarKey, initialWorkspaceTab, REVIEWER_WORKSPACE_SECTIONS, scopeArticleToVersion, visibleWorkspaceTabs, withVersionReviewerData } from '../src/components/admin/workflow/workspaceManifest.mjs';

test('workspace renders backend tab order and hides inaccessible metadata', () => {
  const tabs = visibleWorkspaceTabs({ tabs: [
    { key: 'version-1', label: 'Initial Submission (ART-2026-001)', type: 'article_version' },
    { key: 'version-2', label: 'ART-2026-001 – R2 (Accepted)', type: 'article_version' },
    { key: 'hidden', label: 'Hidden', visible: false },
    { key: 'final-editorial-decision', label: 'Final Editorial Decision' },
    { key: 'communication', label: 'Communication' },
  ] });
  assert.deepEqual(tabs.map((tab) => tab.key), ['version-1', 'version-2', 'final-editorial-decision', 'communication']);
  assert.equal(initialWorkspaceTab(tabs), 'version-1');
  assert.equal(initialWorkspaceTab(tabs, true), 'communication');
});

test('selected article version never merges workflow records from another version', () => {
  const scoped = scopeArticleToVersion({
    title: 'Current title',
    files: [{ id: 1, article_version_id: 10 }, { id: 2, article_version_id: 11 }],
    editorial_decisions: [{ id: 3, article_version_id: 10 }, { id: 4, article_version_id: 11 }],
    sub_editor_assignments: [{ id: 5, article_version_id: 11 }],
    reviewer_assignments: [{ id: 6, article_version_id: 10 }, { id: 7, article_version_id: 11 }],
    production_assignments: [],
  }, { id: 10, metadata_snapshot: { title: 'Immutable title' }, submitted_at: '2026-01-01T00:00:00Z' }, {
    key: 'version-10',
    status: { code: 'submitted', label: 'Submitted' },
    submitted_at: '2026-01-01T00:00:00Z',
    is_accepted: false,
  });
  assert.equal(scoped.title, 'Immutable title');
  assert.equal(scoped.status, 'submitted');
  assert.equal(scoped.author_status, 'Submitted');
  assert.equal(scoped.is_accepted_version, false);
  assert.deepEqual(scoped.files.map((item) => item.id), [1]);
  assert.deepEqual(scoped.editorial_decisions.map((item) => item.id), [3]);
  assert.deepEqual(scoped.sub_editor_assignments, []);
  assert.deepEqual(scoped.reviewer_assignments.map((item) => item.id), [6]);
});

test('only the accepted revision receives accepted version state', () => {
  const article = { status: 'accepted', files: [], editorial_decisions: [], sub_editor_assignments: [], reviewer_assignments: [], production_assignments: [] };
  const initial = scopeArticleToVersion(article, { id: 1, status_snapshot: 'submitted' }, { status: { code: 'submitted', label: 'Submitted' }, is_accepted: false });
  const revision = scopeArticleToVersion(article, { id: 2, status_snapshot: 'under_review' }, { status: { code: 'accepted', label: 'Accepted' }, is_accepted: true });
  assert.equal(initial.status, 'submitted');
  assert.equal(initial.is_accepted_version, false);
  assert.equal(revision.status, 'accepted');
  assert.equal(revision.is_accepted_version, true);
});

test('switching either direction selects the first visible sidebar item', () => {
  const initial = { key: 'version-1', sidebar: [{ key: 'hidden', visible: false }, { key: 'manuscript-information', visible: true }, { key: 'reviewers' }] };
  const revision = { key: 'version-2', sidebar: [{ key: 'manuscript-information', visible: true }, { key: 'reviewers' }] };
  assert.equal(firstVisibleSidebarKey(revision), 'manuscript-information');
  assert.equal(firstVisibleSidebarKey(initial), 'manuscript-information');
});

test('reviewer workspace always has three sections and clears prior version data', () => {
  assert.deepEqual(REVIEWER_WORKSPACE_SECTIONS, ['Suggested Reviewers', 'Opposed Reviewers', 'Manual Invitation']);
  const prior = withVersionReviewerData({}, { reviewer_assignments: [{ id: 9 }], reviewer_preferences: { suggested: [{ id: 8 }], opposed: [] } });
  const next = withVersionReviewerData(prior, null);
  assert.deepEqual(next.reviewer_assignments, []);
  assert.deepEqual(next.reviewer_preferences, { suggested: [], opposed: [] });
});

test('copy editor workspace starts with dedicated accepted manuscript information and has no revision tabs', () => {
  const tabs = visibleWorkspaceTabs({ tabs: [
    { key: 'copyeditor-manuscript', type: 'accepted_manuscript', label: 'Manuscript Information' },
    { key: 'copy-editing', type: 'copy_editing', label: 'Copy Editing' },
    { key: 'workflow-history', type: 'workflow_history', label: 'Workflow History' },
    { key: 'communication', type: 'communication', label: 'Communication' },
  ] });

  assert.equal(initialWorkspaceTab(tabs), 'copyeditor-manuscript');
  assert.deepEqual(tabs.map((tab) => tab.label), ['Manuscript Information', 'Copy Editing', 'Workflow History', 'Communication']);
  assert.equal(tabs.some((tab) => tab.type === 'article_version'), false);
});

test('accepted manuscript view exposes accepted metadata and production files', () => {
  const view = acceptedManuscriptView({
    article: { title: 'Accepted title', abstract: 'Accepted abstract' },
    accepted_version: { id: 12, identifier: 'SN-2026-001-R2' },
    metadata: { article_type: 'Research Article' },
    authors: [{ name: 'Author One' }],
    files: {
      manuscript: [{ id: 1, file: { original_name: 'accepted.docx' } }],
      supplementary: [{ id: 2, file: { original_name: 'dataset.csv' } }],
      accepted_file_set: { id: 4 },
    },
  });

  assert.equal(view.article.title, 'Accepted title');
  assert.equal(view.article.abstract, 'Accepted abstract');
  assert.equal(view.acceptedVersion.id, 12);
  assert.equal(view.manuscriptFiles[0].file.original_name, 'accepted.docx');
  assert.equal(view.supplementaryFiles[0].file.original_name, 'dataset.csv');
  assert.equal(view.acceptedFileSet.id, 4);
});
