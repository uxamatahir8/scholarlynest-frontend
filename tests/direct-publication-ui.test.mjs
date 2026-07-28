import test from 'node:test';
import assert from 'node:assert/strict';
import { directPublicationIssueLabel } from '../src/components/admin/publication/directPublicationUtils.mjs';

test('direct publication issue options identify published and draft issues', () => {
  assert.equal(directPublicationIssueLabel({ volume_number: 1, issue_number: 1, status: 'published' }), 'Volume 1, Issue 1 (published)');
  assert.equal(directPublicationIssueLabel({ volume_number: 2, issue_number: 3, special_title: 'AI Edition', status: 'draft' }), 'Volume 2, Issue 3 — AI Edition (draft)');
});
