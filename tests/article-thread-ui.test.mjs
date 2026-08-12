import test from 'node:test';
import assert from 'node:assert/strict';
import { articleThreadHref, buildThreadMessagePayload, visibleThreadSelection } from '../src/components/admin/threads/threadUtils.mjs';

test('message payload is trimmed, scoped, and deduplicated', () => {
  assert.deepEqual(buildThreadMessagePayload({ body: '  hello  ', replyTo: { id: 9 }, mentionIds: [2, '2'], attachmentIds: [4, 4], clientRequestId: 'request-1' }), {
    body: 'hello', parent_message_id: 9, mentions: [2], attachment_ids: [4], client_request_id: 'request-1',
  });
});

test('direct and lifecycle communication links remain role-workspace specific', () => {
  assert.equal(articleThreadHref({ article_id: 3, direct_publication: true }), '/admin/direct-publications/3?step=6');
  assert.equal(articleThreadHref({ article_id: 4, direct_publication: false }), '/admin/articles/4/workflow');
});

test('polling keeps a visible selection and falls back safely', () => {
  assert.equal(visibleThreadSelection([{ id: 1 }, { id: 2 }], 2), 2);
  assert.equal(visibleThreadSelection([{ id: 1 }], 2), 1);
  assert.equal(visibleThreadSelection([], 2), null);
});
