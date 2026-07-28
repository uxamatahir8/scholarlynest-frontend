import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedDirectPublicationStep, directPublicationIssueLabel, restoredDirectPublicationStep } from '../src/components/admin/publication/directPublicationUtils.mjs';

test('direct publication issue options identify published and draft issues', () => {
  assert.equal(directPublicationIssueLabel({ volume_number: 1, issue_number: 1, status: 'published' }), 'Volume 1, Issue 1 (published)');
  assert.equal(directPublicationIssueLabel({ volume_number: 2, issue_number: 3, special_title: 'AI Edition', status: 'draft' }), 'Volume 2, Issue 3 — AI Edition (draft)');
});

test('direct publication drafts reopen on their last saved wizard step', () => {
  assert.equal(restoredDirectPublicationStep({ requestedStep: null, savedStep: '4', status: 'direct_publication_draft', stepCount: 7 }), 4);
  assert.equal(restoredDirectPublicationStep({ requestedStep: '2', savedStep: '4', status: 'direct_publication_draft', stepCount: 7 }), 2);
  assert.equal(restoredDirectPublicationStep({ requestedStep: null, savedStep: '4', status: 'published', stepCount: 7 }), 0);
  assert.equal(boundedDirectPublicationStep('99', 7), 6);
  assert.equal(boundedDirectPublicationStep('invalid', 7), 0);
});
