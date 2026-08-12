export function buildThreadMessagePayload({ body, replyTo, mentionIds = [], attachmentIds = [], clientRequestId }) {
  return {
    body: String(body || '').trim(),
    parent_message_id: replyTo?.id || null,
    mentions: [...new Set(mentionIds.map(Number))],
    attachment_ids: [...new Set(attachmentIds.map(Number))],
    client_request_id: clientRequestId,
  };
}

export function articleThreadHref(item) {
  if (!item?.article_id) return '/admin/notifications';
  return item.direct_publication
    ? `/admin/direct-publications/${item.article_id}?step=6`
    : `/admin/articles/${item.article_id}/workflow`;
}

export function visibleThreadSelection(items, selectedId) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items.some((item) => Number(item.id) === Number(selectedId)) ? selectedId : items[0].id;
}
