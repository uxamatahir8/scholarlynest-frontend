'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  LifeBuoy,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { uploadAndAwaitClean } from '../../../lib/mediaUploads/DirectUploadClient';
import { Button } from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import ErrorState from '../../ui/ErrorState';
import LoadingState from '../../ui/LoadingState';
import StatusBadge from '../../ui/StatusBadge';
import { supportTicketSchema, validateWithZod } from '../../../lib/validation';

const ISSUE_TYPES = [
  ['technical_issue', 'Technical issue'],
  ['account_issue', 'Account issue'],
  ['article_submission', 'Article submission'],
  ['reviewer_issue', 'Reviewer issue'],
  ['payment_billing', 'Payment or billing'],
  ['publication_issue', 'Publication issue'],
  ['other', 'Other'],
];

const STATUS_OPTIONS = [
  ['submitted', 'Submitted'],
  ['in_review', 'In review'],
  ['waiting_for_user', 'Waiting for user'],
  ['resolved', 'Resolved'],
  ['closed', 'Closed'],
];

const formatLabel = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const formatDate = (value) => (value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not set');
const bytes = (value) => {
  if (!value) return '0 KB';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

function AttachmentPicker({ files, setFiles, disabled }) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500" htmlFor="support-attachments">Attachments</label>
      <input
        id="support-attachments"
        type="file"
        multiple
        disabled={disabled}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
        onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 10))}
        className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:file:bg-zinc-100 dark:file:text-zinc-950"
      />
      {files.length > 0 && (
        <div className="grid gap-2">
          {files.map((file) => (
            <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="min-w-0 truncate font-semibold text-zinc-700 dark:text-zinc-200">{file.name}</span>
              <span className="shrink-0 text-zinc-400">{bytes(file.size)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentList({ attachments = [] }) {
  if (!attachments.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.download_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:border-amber-400 hover:text-amber-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{attachment.original_filename || 'Attachment'}</span>
          <span className="shrink-0 text-zinc-400">{bytes(attachment.size_bytes)}</span>
        </a>
      ))}
    </div>
  );
}

function TicketCard({ ticket, admin }) {
  return (
    <Link href={admin ? `/admin/support-tickets/${ticket.id}` : `/admin/support/${ticket.id}`} className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{ticket.ticket_number}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{formatLabel(ticket.issue_type)}</span>
          </div>
          <h3 className="truncate text-sm font-bold text-zinc-950 dark:text-white">{ticket.title}</h3>
          {admin && ticket.user && <p className="text-xs font-medium text-zinc-500">{ticket.user.name} · {ticket.user.email}</p>}
        </div>
        <div className="text-left text-[11px] font-semibold text-zinc-400 sm:text-right">
          <div>Updated {formatDate(ticket.updated_at)}</div>
          {ticket.last_reply_at && <div>Last reply {formatDate(ticket.last_reply_at)}</div>}
        </div>
      </div>
    </Link>
  );
}

export default function SupportTicketWorkspace({ mode = 'list', admin = false, ticketId = null }) {
  const router = useRouter();
  const { user, loading: authLoading, hasPermission, hasRole } = useAuth();
  const { toast } = useToast();
  const canManage = hasPermission('support_ticket_management') || hasRole(['admin', 'super_admin']);
  const basePath = admin ? '/admin/support/tickets' : '/support/tickets';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', issue_type: '' });
  const [form, setForm] = useState({ issue_type: 'technical_issue', title: '', details: '' });
  const [reply, setReply] = useState('');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadState, setUploadState] = useState('');

  const listUrl = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const suffix = params.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  }, [basePath, filters]);

  const uploadFiles = useCallback(async () => {
    if (!files.length) return [];
    const uploads = [];
    for (const file of files) {
      setUploadState(`Uploading ${file.name}`);
      const upload = await uploadAndAwaitClean({
        file,
        purpose: 'support_ticket_attachment',
        onStatus: (status) => setUploadState(status.status === 'clean' ? `Scanned ${file.name}` : `Scanning ${file.name}`),
      });
      uploads.push(upload.id);
    }
    setUploadState('');
    return uploads;
  }, [files]);

  const loadList = useCallback(async () => {
    if (!user || mode !== 'list') return;
    if (admin && !canManage) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(listUrl);
      setTickets(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Support tickets could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [admin, canManage, listUrl, mode, user]);

  const loadTicket = useCallback(async () => {
    if (!user || mode !== 'detail' || !ticketId) return;
    if (admin && !canManage) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`${basePath}/${ticketId}`);
      setTicket(response.data.ticket);
    } catch (err) {
      setError(err.response?.data?.message || 'Support ticket could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [admin, basePath, canManage, mode, ticketId, user]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const submitTicket = async (event) => {
    event.preventDefault();
    const validation = validateWithZod(supportTicketSchema, form);
    if (!validation.success) { setError(Object.values(validation.errors)[0]); return; }
    setSaving(true);
    setError('');
    try {
      const attachments = await uploadFiles();
      const response = await api.post('/support/tickets', { ...form, attachments });
      toast('Support ticket submitted.', 'success');
      router.push(`/admin/support/${response.data.ticket.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Support ticket could not be submitted.');
      toast('Support ticket could not be submitted.', 'error');
    } finally {
      setSaving(false);
      setUploadState('');
    }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    if (!reply.trim()) { setError('Reply message is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const attachments = await uploadFiles();
      const response = await api.post(`${basePath}/${ticket.id}/messages`, { message: reply, attachments });
      setTicket(response.data.ticket);
      setReply('');
      setFiles([]);
      toast('Reply added.', 'success');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Reply could not be added.');
      toast('Reply could not be added.', 'error');
    } finally {
      setSaving(false);
      setUploadState('');
    }
  };

  const updateStatus = async (status) => {
    setSaving(true);
    try {
      const response = await api.patch(`${basePath}/${ticket.id}/status`, { status });
      setTicket(response.data.ticket);
      toast('Ticket status updated.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Ticket status could not be updated.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <LoadingState label="Loading support workspace..." className="min-h-[420px]" />;
  if (!user) return <ErrorState title="Support unavailable">Sign in again to access support tickets.</ErrorState>;
  if (admin && !canManage) return <ErrorState title="Access restricted">Support ticket management requires support access.</ErrorState>;

  if (mode === 'create') {
    return (
      <div className="space-y-6">
        <Link href="/admin/support" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-amber-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Support tickets
        </Link>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-3">
            <LifeBuoy className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <h1 className="text-lg font-bold text-zinc-950 dark:text-white">New Support Ticket</h1>
          </div>
          {error && <ErrorState title="Submission problem" className="mb-4">{error}</ErrorState>}
          <form onSubmit={submitTicket} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500" htmlFor="issue_type">Issue type</label>
                <select id="issue_type" value={form.issue_type} onChange={(event) => setForm((current) => ({ ...current, issue_type: event.target.value }))} className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  {ISSUE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500" htmlFor="title">Title</label>
                <input id="title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500" htmlFor="details">Details</label>
              <textarea id="details" value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} rows={8} className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
            </div>
            <AttachmentPicker files={files} setFiles={setFiles} disabled={saving} />
            {uploadState && <p className="text-xs font-semibold text-amber-700">{uploadState}</p>}
            <Button type="submit" icon={Send} loading={saving}>Submit Ticket</Button>
          </form>
        </section>
      </div>
    );
  }

  if (mode === 'detail') {
    if (loading) return <LoadingState label="Loading support ticket..." className="min-h-[420px]" />;
    if (error) return <ErrorState title="Support ticket unavailable">{error}</ErrorState>;
    if (!ticket) return null;

    return (
      <div className="space-y-6">
        <Link href={admin ? '/admin/support-tickets' : '/admin/support'} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-amber-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {admin ? 'Support management' : 'My support tickets'}
        </Link>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={ticket.status} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{ticket.ticket_number}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{formatLabel(ticket.issue_type)}</span>
              </div>
              <h1 className="text-xl font-bold text-zinc-950 dark:text-white">{ticket.title}</h1>
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">{ticket.details}</p>
              <AttachmentList attachments={ticket.attachments} />
            </div>
            {admin && ticket.can_update_status && (
              <div className="w-full max-w-xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500" htmlFor="ticket-status">Status</label>
                <select id="ticket-status" value={ticket.status} disabled={saving} onChange={(event) => updateStatus(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">Conversation</h2>
            </div>
            {(ticket.messages || []).length === 0 ? (
              <EmptyState icon={MessageSquare} title="No replies yet." />
            ) : (
              ticket.messages.map((message) => (
                <article key={message.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-zinc-900 dark:text-white">{message.author?.name || 'Support'}</div>
                    <span className="text-[11px] font-semibold text-zinc-400">{formatDate(message.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">{message.message}</p>
                  <AttachmentList attachments={message.attachments} />
                </article>
              ))
            )}
            {ticket.can_reply ? (
              <form onSubmit={submitReply} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                {error && <ErrorState title="Reply problem" className="mb-4">{error}</ErrorState>}
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500" htmlFor="reply">Reply</label>
                <textarea id="reply" value={reply} onChange={(event) => setReply(event.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
                <div className="mt-4">
                  <AttachmentPicker files={files} setFiles={setFiles} disabled={saving} />
                </div>
                {uploadState && <p className="mt-3 text-xs font-semibold text-amber-700">{uploadState}</p>}
                <Button type="submit" icon={Send} loading={saving} className="mt-4">Send Reply</Button>
              </form>
            ) : (
              <EmptyState icon={AlertCircle} title="Replies are closed for this ticket." />
            )}
          </div>

          <aside className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">Activity</h2>
            </div>
            <div className="space-y-2">
              {(ticket.activities || []).map((activity) => (
                <div key={activity.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="font-bold text-zinc-800 dark:text-zinc-100">{formatLabel(activity.activity_type)}</div>
                  <div className="mt-1 text-zinc-500">{formatDate(activity.created_at)}</div>
                  {activity.actor && <div className="mt-1 text-zinc-500">By {activity.actor.name}</div>}
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" /> Support
          </div>
          <h1 className="mt-2 text-xl font-bold text-zinc-950 dark:text-white">{admin ? 'Support Tickets' : 'My Support Tickets'}</h1>
        </div>
        {!admin && (
          <Link href="/admin/support/new">
            <Button type="button" icon={Plus}>New Ticket</Button>
          </Link>
        )}
      </div>
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_190px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search tickets" className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
          </div>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={filters.issue_type} onChange={(event) => setFilters((current) => ({ ...current, issue_type: event.target.value }))} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <option value="">All issue types</option>
            {ISSUE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <Button type="button" variant="outline" icon={RefreshCw} onClick={loadList} loading={loading}>Refresh</Button>
        </div>
      </section>
      {error && <ErrorState title="Support tickets could not be loaded">{error}</ErrorState>}
      {loading ? (
        <LoadingState label="Loading support tickets..." className="min-h-[280px]" />
      ) : tickets.length === 0 ? (
        <EmptyState icon={FileText} title="No support tickets found.">{admin ? 'Tickets submitted by users will appear here.' : 'Create a ticket when you need help from the support team.'}</EmptyState>
      ) : (
        <div className="grid gap-3">
          {tickets.map((item) => <TicketCard key={item.id} ticket={item} admin={admin} />)}
        </div>
      )}
    </div>
  );
}
