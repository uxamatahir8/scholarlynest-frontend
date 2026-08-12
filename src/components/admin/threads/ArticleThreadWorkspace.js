'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Archive, ArrowLeft, FileText, Lock, MessageSquare, Paperclip, Plus, Reply, Search, Send, Shield, Unlock, UserPlus, Users, X } from 'lucide-react';
import api, { buildApiUrl } from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import LoadingState from '../../ui/LoadingState';
import EmptyState from '../../ui/EmptyState';
import ErrorState from '../../ui/ErrorState';
import { buildThreadMessagePayload, visibleThreadSelection } from './threadUtils.mjs';

const requestId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const formatTime = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'No activity';

export default function ArticleThreadWorkspace({ articleId, availableFiles = [], initialThreadId = null, directPublication = false }) {
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(initialThreadId ? Number(initialThreadId) : null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [attachmentIds, setAttachmentIds] = useState([]);
  const [mentionIds, setMentionIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [eligible, setEligible] = useState([]);
  const [audit, setAudit] = useState(null);
  const composerRef = useRef(null);
  const messagesScrollerRef = useRef(null);

  const selected = useMemo(() => threads.find((thread) => Number(thread.id) === Number(selectedId)) || null, [threads, selectedId]);

  const loadThreads = useCallback(async ({ quiet = false } = {}) => {
    if (!articleId) return;
    if (!quiet) setLoading(true);
    try {
      const response = query.trim().length >= 2
        ? await api.get(`/articles/${articleId}/threads/search`, { params: { q: query.trim(), archived: showArchived ? 1 : 0 } })
        : await api.get(`/articles/${articleId}/threads`, { params: { archived: showArchived ? 1 : 0 } });
      const items = response.data?.data || [];
      setThreads(items);
      setError('');
      setSelectedId((current) => visibleThreadSelection(items, current));
    } catch (err) {
      if (!quiet) setError(safeApiMessage(err, 'Unable to load article communication.'));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [articleId, query, showArchived]);

  const loadMessages = useCallback(async ({ quiet = false } = {}) => {
    if (!articleId || !selectedId) return;
    if (!quiet) setMessagesLoading(true);
    try {
      const response = await api.get(`/articles/${articleId}/threads/${selectedId}/messages`, { params: { per_page: 100 } });
      setMessages(response.data?.data || []);
      const last = response.data?.data?.at?.(-1);
      await api.post(`/articles/${articleId}/threads/${selectedId}/read`, last ? { message_id: last.id } : {});
      if (!quiet) await loadThreads({ quiet: true });
    } catch (err) {
      if (!quiet) setError(safeApiMessage(err, 'Unable to load messages.'));
    } finally {
      if (!quiet) setMessagesLoading(false);
    }
  }, [articleId, selectedId, loadThreads]);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { setMessages([]); setReplyTo(null); setAudit(null); loadMessages(); }, [selectedId]);
  useEffect(() => {
    if (messagesLoading || messages.length === 0) return;
    const scroller = messagesScrollerRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [selectedId, messages.length, messagesLoading]);
  useEffect(() => {
    if (!articleId) return undefined;
    const seconds = selected?.poll_interval_seconds || 15;
    const timer = window.setInterval(() => { loadThreads({ quiet: true }); if (selectedId) loadMessages({ quiet: true }); }, seconds * 1000);
    return () => window.clearInterval(timer);
  }, [articleId, selectedId, selected?.poll_interval_seconds, loadThreads, loadMessages]);

  const send = async (event) => {
    event.preventDefault();
    if (!body.trim() || busy || !selected) return;
    setBusy(true);
    try {
      await api.post(`/articles/${articleId}/threads/${selected.id}/messages`, buildThreadMessagePayload({
        body, replyTo, mentionIds, attachmentIds, clientRequestId: requestId(),
      }));
      setBody(''); setReplyTo(null); setAttachmentIds([]); setMentionIds([]);
      await Promise.all([loadMessages(), loadThreads({ quiet: true })]);
    } catch (err) {
      setError(safeApiMessage(err, 'The message could not be sent.'));
    } finally { setBusy(false); }
  };

  const transition = async (action) => {
    if (!selected || busy) return;
    setBusy(true);
    try { await api.post(`/articles/${articleId}/threads/${selected.id}/${action}`); await loadThreads(); }
    catch (err) { setError(safeApiMessage(err, `Unable to ${action} this thread.`)); }
    finally { setBusy(false); }
  };

  const editMessage = async (message) => {
    const next = window.prompt('Edit message', message.body || '');
    if (!next?.trim() || next === message.body) return;
    try { await api.patch(`/articles/${articleId}/threads/${selected.id}/messages/${message.id}`, { body: next.trim() }); await loadMessages(); }
    catch (err) { setError(safeApiMessage(err, 'Unable to edit the message.')); }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm('Delete this message? The audit history will be retained.')) return;
    try { await api.delete(`/articles/${articleId}/threads/${selected.id}/messages/${message.id}`); await loadMessages(); }
    catch (err) { setError(safeApiMessage(err, 'Unable to delete the message.')); }
  };

  const openParticipants = async () => {
    setShowPeople(true);
    if (!selected?.capabilities?.manage_participants) return;
    try { const response = await api.get(`/articles/${articleId}/threads/${selected.id}/eligible-users`); setEligible(response.data?.data || []); }
    catch (err) { setError(safeApiMessage(err, 'Unable to load eligible participants.')); }
  };

  const addParticipant = async (userId) => {
    try { await api.post(`/articles/${articleId}/threads/${selected.id}/participants`, { user_id: userId, access_level: 'reply' }); await loadThreads(); }
    catch (err) { setError(safeApiMessage(err, 'Unable to add this participant.')); }
  };

  const removeParticipant = async (participantId) => {
    if (!window.confirm('Remove this participant and revoke access immediately?')) return;
    try { await api.delete(`/articles/${articleId}/threads/${selected.id}/participants/${participantId}`); await loadThreads(); }
    catch (err) { setError(safeApiMessage(err, 'Unable to remove this participant.')); }
  };

  const loadAudit = async () => {
    try { const response = await api.get(`/articles/${articleId}/threads/${selected.id}/audit`); setAudit(response.data?.data?.data || []); }
    catch (err) { setError(safeApiMessage(err, 'Unable to load thread history.')); }
  };

  const download = async (attachment) => {
    try {
      const response = await api.get(buildApiUrl(attachment.download_url), { params: { json: 1 } });
      const anchor = document.createElement('a'); anchor.href = response.data.download_url; anchor.rel = 'noopener'; anchor.download = response.data.filename || attachment.filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    } catch (err) { setError(safeApiMessage(err, 'Unable to download this attachment.')); }
  };

  if (!articleId) return <EmptyState title="Create the article first">Communication becomes available as soon as the article record exists.</EmptyState>;
  if (loading) return <LoadingState label="Loading article communication…" className="min-h-80" />;
  if (error && threads.length === 0) return <ErrorState title="Communication unavailable" onRetry={loadThreads}>{error}</ErrorState>;

  return <div className="flex h-[calc(100dvh-2rem)] max-h-screen flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm lg:h-screen">
    {error && <div role="alert" className="flex items-center justify-between gap-3 border-b border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X className="h-4 w-4"/></button></div>}
    <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className={`${selected ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-r border-[var(--border)]`}>
        <div className="border-b border-[var(--border)] p-4"><div className="flex items-center justify-between"><div><h2 className="font-bold">Communication</h2><p className="text-xs text-[var(--muted)]">{threads.reduce((sum, item) => sum + item.unread_count, 0)} unread</p></div><MessageSquare className="h-5 w-5 text-[var(--primary)]"/></div><label className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--border)] px-3"><Search className="h-4 w-4 text-[var(--muted)]"/><input aria-label="Search threads" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search discussions"/></label><label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)}/>Include archived</label></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">{threads.length === 0 ? <p className="p-5 text-center text-sm text-[var(--muted)]">No accessible threads.</p> : threads.map((thread) => <button key={thread.id} onClick={() => setSelectedId(thread.id)} className={`mb-1 w-full rounded-xl border p-3 text-left ${Number(selectedId) === Number(thread.id) ? 'border-[var(--primary)] bg-[var(--surface-muted)]' : 'border-transparent hover:bg-[var(--surface-muted)]'}`}><div className="flex items-start justify-between gap-2"><span className="text-sm font-bold">{thread.title}</span>{thread.unread_count > 0 && <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs font-bold text-white">{thread.unread_count}</span>}</div><p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">{thread.privacy_label}</p><p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">{thread.last_message?.body || 'No messages yet'}</p><p className="mt-2 text-[10px] text-[var(--muted)]">{formatTime(thread.last_message_at)}</p></button>)}</div>
      </aside>
      <section className={`${!selected ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col`}>
        {!selected ? <div className="grid flex-1 place-items-center"><EmptyState title="Select a discussion">Choose an authorized thread to read and reply.</EmptyState></div> : <>
          <header className="border-b border-[var(--border)] p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><button className="mt-0.5 lg:hidden" onClick={() => setSelectedId(null)} aria-label="Back to thread list"><ArrowLeft className="h-5 w-5"/></button><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{selected.title}</h2><span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase">{selected.status}</span></div><p className="mt-1 text-xs text-[var(--muted)]">{selected.context_label}</p><div className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${selected.privacy_classification.includes('confidential') ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-900'}`}><Shield className="h-3.5 w-3.5"/>{selected.privacy_label}</div></div></div><div className="flex gap-1"><button onClick={openParticipants} className="rounded-lg border p-2" aria-label="Participants"><Users className="h-4 w-4"/></button>{selected.capabilities.lock && <button disabled={busy} onClick={() => transition('lock')} className="rounded-lg border p-2" aria-label="Lock thread"><Lock className="h-4 w-4"/></button>}{selected.capabilities.unlock && <button disabled={busy} onClick={() => transition('unlock')} className="rounded-lg border p-2" aria-label="Unlock thread"><Unlock className="h-4 w-4"/></button>}{selected.capabilities.archive && <button disabled={busy} onClick={() => transition('archive')} className="rounded-lg border p-2" aria-label="Archive thread"><Archive className="h-4 w-4"/></button>}{selected.capabilities.reopen && <button disabled={busy} onClick={() => transition('reopen')} className="rounded-lg border p-2" aria-label="Reopen thread"><Unlock className="h-4 w-4"/></button>}</div></div></header>
          <div ref={messagesScrollerRef} className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface-muted)]/40 p-4 sm:p-6">{messagesLoading ? <LoadingState label="Loading messages…"/> : messages.length === 0 ? <EmptyState title="No messages yet">Start this purpose-specific discussion when you are ready.</EmptyState> : <ol className="space-y-4">{messages.map((message) => <li key={message.id} className={`rounded-xl border p-4 ${message.is_system ? 'border-sky-200 bg-sky-50/70 dark:bg-sky-950/20' : 'border-[var(--border)] bg-[var(--surface)]'}`}><div className="flex items-start justify-between gap-3"><div><span className="text-sm font-bold">{message.sender.display_name}</span><span className="ml-2 text-[10px] font-bold uppercase text-[var(--muted)]">{message.sender.role}</span></div><time className="text-[10px] text-[var(--muted)]">{formatTime(message.created_at)}</time></div>{message.parent && <blockquote className="mt-2 rounded-md border-l-2 border-[var(--primary)] bg-[var(--surface-muted)] p-2 text-xs text-[var(--muted)]">{message.parent.body}</blockquote>}<p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.deleted ? 'This message was deleted.' : message.body}{message.edited && !message.deleted ? <span className="ml-2 text-[10px] text-[var(--muted)]">(edited)</span> : null}</p>{message.attachments.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{message.attachments.map((attachment) => <button key={attachment.id} onClick={() => download(attachment)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold"><FileText className="h-4 w-4"/>{attachment.filename}</button>)}</div>}{!message.is_system && !message.deleted && <div className="mt-3 flex gap-3 text-xs font-semibold text-[var(--muted)]"><button onClick={() => { setReplyTo(message); composerRef.current?.focus(); }} className="inline-flex items-center gap-1"><Reply className="h-3.5 w-3.5"/>Reply</button>{message.capabilities.edit && <button onClick={() => editMessage(message)}>Edit</button>}{message.capabilities.delete && <button onClick={() => deleteMessage(message)} className="text-red-600">Delete</button>}</div>}</li>)}</ol>}</div>
          <form onSubmit={send} className="border-t border-[var(--border)] p-4">{replyTo && <div className="mb-2 flex items-center justify-between rounded-lg bg-[var(--surface-muted)] p-2 text-xs"><span>Replying to {replyTo.sender.display_name}: {replyTo.body?.slice(0, 80)}</span><button type="button" onClick={() => setReplyTo(null)}><X className="h-4 w-4"/></button></div>}<p className="mb-2 text-xs font-bold text-amber-700">Audience: {selected.privacy_label}</p><textarea ref={composerRef} aria-label="Message" value={body} onChange={(event) => setBody(event.target.value)} disabled={!selected.capabilities.send_message || busy} maxLength={10000} rows={3} className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60" placeholder={selected.capabilities.send_message ? 'Write a message…' : `This thread is ${selected.status}.`}/><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><details><summary className="inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold"><Paperclip className="h-4 w-4"/>Attachments ({attachmentIds.length})</summary><div className="absolute z-20 mt-1 max-h-56 w-72 overflow-auto rounded-xl border bg-[var(--surface)] p-2 shadow-xl">{availableFiles.filter((file) => file.scan_status === 'clean').length === 0 ? <p className="p-2 text-xs text-[var(--muted)]">No clean authorized article files are available.</p> : availableFiles.filter((file) => file.scan_status === 'clean').map((file) => <label key={file.id} className="flex gap-2 p-2 text-xs"><input type="checkbox" checked={attachmentIds.includes(file.id)} onChange={(event) => setAttachmentIds((ids) => event.target.checked ? [...ids, file.id] : ids.filter((id) => id !== file.id))}/><span className="truncate">{file.safe_original_name || file.original_name || file.file_title}</span></label>)}</div></details><details><summary className="inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold"><Users className="h-4 w-4"/>Mentions ({mentionIds.length})</summary><div className="absolute z-20 mt-1 max-h-56 w-64 overflow-auto rounded-xl border bg-[var(--surface)] p-2 shadow-xl">{selected.mentionable_users.map((person) => person.user_id && <label key={person.participant_id} className="flex gap-2 p-2 text-xs"><input type="checkbox" checked={mentionIds.includes(person.user_id)} onChange={(event) => setMentionIds((ids) => event.target.checked ? [...ids, person.user_id] : ids.filter((id) => id !== person.user_id))}/><span>@{person.display_name}</span></label>)}</div></details></div><button disabled={!body.trim() || !selected.capabilities.send_message || busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4"/>{busy ? 'Sending…' : 'Send'}</button></div></form>
        </>}
      </section>
    </div>
    {showPeople && selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Thread participants"><div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-[var(--surface)] p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="font-bold">Participants</h2><button onClick={() => setShowPeople(false)} aria-label="Close"><X className="h-5 w-5"/></button></div><ul className="mt-4 space-y-2">{selected.participants.map((person) => <li key={person.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-bold">{person.display_name}</p><p className="text-xs text-[var(--muted)]">{person.role} · {person.access_level}</p></div>{person.can_remove && <button onClick={() => removeParticipant(person.id)} className="text-xs font-bold text-red-600">Remove</button>}</li>)}</ul>{selected.capabilities.manage_participants && <div className="mt-5 border-t pt-4"><h3 className="text-xs font-bold uppercase text-[var(--muted)]">Eligible users</h3><div className="mt-2 space-y-2">{eligible.filter((user) => !selected.participants.some((person) => Number(person.user_id) === Number(user.id))).map((user) => <button key={user.id} onClick={() => addParticipant(user.id)} className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm"><span>{user.name} · {user.role}</span><UserPlus className="h-4 w-4"/></button>)}</div><button onClick={loadAudit} className="mt-4 text-xs font-bold text-[var(--primary)]">View audit history</button>{audit && <ol className="mt-3 space-y-2">{audit.map((entry) => <li key={entry.id} className="rounded-lg bg-[var(--surface-muted)] p-2 text-xs"><strong>{entry.event}</strong> · {entry.actor?.name || 'System'} · {formatTime(entry.created_at)}</li>)}</ol>}</div>}</div></div>}
  </div>;
}
