import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorkspaceTab, scopeArticleToVersion, visibleWorkspaceTabs } from '../src/components/admin/workflow/workspaceManifest.mjs';

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
  }, { id: 10, metadata_snapshot: { title: 'Immutable title' } });
  assert.equal(scoped.title, 'Immutable title');
  assert.deepEqual(scoped.files.map((item) => item.id), [1]);
  assert.deepEqual(scoped.editorial_decisions.map((item) => item.id), [3]);
  assert.deepEqual(scoped.sub_editor_assignments, []);
  assert.deepEqual(scoped.reviewer_assignments.map((item) => item.id), [6]);
});
