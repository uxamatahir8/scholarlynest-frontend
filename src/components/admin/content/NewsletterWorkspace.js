'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { History, Mail, RefreshCw, Search, Send, Users, X } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../ui/Button';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import EmptyState from '../../ui/EmptyState';
import ErrorState from '../../ui/ErrorState';
import LoadingState from '../../ui/LoadingState';
import ContentStatusBadge from './ContentStatusBadge';
import { formatDate } from './contentUtils';

const starterContent = '<p>Dear Scholar,</p><p>We are sharing the latest ScholarlyNest publication update with our subscribed research community.</p>';

export default function NewsletterWorkspace() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('compose');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState(starterContent);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [confirmSend, setConfirmSend] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState(null);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});

  const canView = hasPermission('newsletters.view-any');
  const canSend = hasPermission('newsletters.send');

  const activeSubscribers = subscribers.filter((subscriber) => subscriber.is_active !== false);
  const filteredSubscribers = activeSubscribers.filter((subscriber) => subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredRecipients = activeSubscribers.filter((subscriber) => subscriber.email.toLowerCase().includes(recipientSearch.toLowerCase()));

  const selectedCount = selectedEmails.length;
  const summaryItems = useMemo(() => [
    { label: 'Active subscribers', value: activeSubscribers.length, icon: Users },
    { label: 'Sent campaigns', value: campaigns.length, icon: Mail },
    { label: 'Selected recipients', value: selectedCount, icon: Send },
  ], [activeSubscribers.length, campaigns.length, selectedCount]);

  const loadData = async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [subscribersRes, campaignsRes] = await Promise.all([
        api.get('/admin/newsletter/subscribers'),
        api.get('/admin/newsletter/campaigns'),
      ]);
      const nextSubscribers = Array.isArray(subscribersRes.data) ? subscribersRes.data : [];
      setSubscribers(nextSubscribers);
      setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
      setSelectedEmails(nextSubscribers.filter((subscriber) => subscriber.is_active !== false).map((subscriber) => subscriber.email));
    } catch (err) {
      logError('Failed to load newsletter workspace:', err);
      setError(safeApiMessage(err, 'Unable to load newsletter workspace.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user, canView]);

  const validate = () => {
    const nextErrors = {};
    if (!subject.trim()) nextErrors.subject = 'Subject is required.';
    if (!content.trim()) nextErrors.content = 'Email content is required.';
    if (selectedEmails.length === 0) nextErrors.recipients = 'Select at least one active subscriber.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const prepareSend = (event) => {
    event.preventDefault();
    if (validate()) setConfirmSend(true);
  };

  const sendCampaign = async () => {
    try {
      setSending(true);
      await api.post('/admin/newsletter/send', {
        subject: subject.trim(),
        content: content.trim(),
        recipients: selectedEmails,
      });
      toast('Newsletter campaign sent.', 'success');
      setSubject('');
      setContent(starterContent);
      setConfirmSend(false);
      await loadData();
    } catch (err) {
      logError('Failed to send newsletter campaign:', err);
      toast(safeApiMessage(err, 'Unable to send newsletter campaign.'), 'error');
    } finally {
      setSending(false);
    }
  };

  const toggleEmail = (email) => {
    setSelectedEmails((prev) => prev.includes(email) ? prev.filter((item) => item !== email) : [...prev, email]);
  };

  const previewHtml = (html) => `
    <html>
      <body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
        <main style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;">
          <header style="background:#18181b;color:#fff;padding:18px 24px;font-weight:700;">ScholarlyNest Press</header>
          <section style="padding:24px;font-size:14px;line-height:1.6;">${html || '<p>Campaign content preview.</p>'}</section>
          <footer style="padding:18px 24px;background:#fafafa;color:#71717a;font-size:12px;border-top:1px solid #e4e4e7;">Subscribers receive an unsubscribe link generated for their address.</footer>
        </main>
      </body>
    </html>
  `;

  if (authLoading || loading) return <LoadingState label="Loading newsletter workspace..." className="min-h-[420px]" />;
  if (!user || !canView) return <ErrorState title="Access restricted">Newsletter management requires newsletter viewing access.</ErrorState>;

  return (
    <main className="space-y-6">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Audience Communications</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">Newsletter Workspace</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Compose supported newsletter emails, review sent campaigns, and manage the authorized subscriber list.
            </p>
          </div>
          <Button type="button" variant="outline" icon={RefreshCw} onClick={loadData}>Refresh</Button>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <item.icon className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              <dt className="mt-3 text-xs font-semibold text-[var(--muted)]">{item.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-[var(--foreground)]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {error ? (
        <ErrorState title="Newsletter workspace could not be loaded">{error}</ErrorState>
      ) : (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-wrap gap-2 border-b border-[var(--border)] p-3">
            {[
              ['compose', 'Compose', Send],
              ['campaigns', 'Sent Campaigns', History],
              ['subscribers', 'Subscribers', Users],
            ].map(([key, label, Icon]) => (
              <button key={key} type="button" onClick={() => setActiveTab(key)} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${activeTab === key ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--muted)] hover:bg-[var(--surface-muted)]'}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {activeTab === 'compose' && (
            <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <form onSubmit={prepareSend} className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-[var(--foreground)]">Campaign Details</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">Sending delivers to selected active subscribers immediately. Scheduling is not supported by the current API.</p>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Subject</span>
                  <input value={subject} aria-invalid={Boolean(errors.subject)} onChange={(event) => setSubject(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                  {errors.subject && <p className="mt-1 text-sm font-semibold text-red-600">{errors.subject}</p>}
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Email content</span>
                  <textarea value={content} rows={14} aria-invalid={Boolean(errors.content)} onChange={(event) => setContent(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                  {errors.content && <p className="mt-1 text-sm font-semibold text-red-600">{errors.content}</p>}
                </label>
                <Button type="submit" icon={Send} disabled={!canSend || activeSubscribers.length === 0}>
                  {canSend ? 'Review and Send' : 'Send Permission Required'}
                </Button>
                {activeSubscribers.length === 0 && <p className="text-sm font-semibold text-amber-700">No active subscribers are available for sending.</p>}
              </form>
              <aside className="space-y-4">
                <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Audience</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{selectedEmails.length} of {activeSubscribers.length} active subscribers selected.</p>
                  {errors.recipients && <p className="mt-2 text-sm font-semibold text-red-600">{errors.recipients}</p>}
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedEmails(activeSubscribers.map((subscriber) => subscriber.email))}>Select All</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedEmails([])}>Clear</Button>
                  </div>
                  <label className="mt-4 block">
                    <span className="sr-only">Search recipients</span>
                    <input value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} placeholder="Search recipients..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
                  </label>
                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    {filteredRecipients.map((subscriber) => (
                      <label key={subscriber.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
                        <input type="checkbox" checked={selectedEmails.includes(subscriber.email)} onChange={() => toggleEmail(subscriber.email)} className="h-4 w-4 rounded border-[var(--border)]" />
                        <span className="min-w-0 truncate font-semibold text-[var(--foreground)]">{subscriber.email}</span>
                      </label>
                    ))}
                  </div>
                </section>
                <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                  <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-bold text-[var(--foreground)]">Email Preview</div>
                  <iframe title="newsletter preview" srcDoc={previewHtml(content)} className="h-[360px] w-full bg-white" />
                </section>
              </aside>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="p-5">
              {campaigns.length === 0 ? (
                <EmptyState icon={History} title="No campaigns have been sent.">Sent campaigns will appear here after dispatch.</EmptyState>
              ) : (
                <div className="divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)]">
                  {campaigns.map((campaign) => (
                    <article key={campaign.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_120px_160px_auto] md:items-center">
                      <h2 className="font-bold text-[var(--foreground)]">{campaign.subject}</h2>
                      <ContentStatusBadge status="sent">Sent</ContentStatusBadge>
                      <span className="text-sm text-[var(--muted)]">{campaign.recipients_count ?? campaign.recipient_count ?? 0} recipients</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => setPreviewCampaign(campaign)}>Preview</Button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="space-y-4 p-5">
              <label className="relative block max-w-sm">
                <span className="sr-only">Search subscribers</span>
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted)]" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search subscribers..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
              </label>
              {filteredSubscribers.length === 0 ? (
                <EmptyState icon={Users} title="No subscribers found.">Subscriber emails appear only in this authorized management workspace.</EmptyState>
              ) : (
                <div className="divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)]">
                  {filteredSubscribers.map((subscriber) => (
                    <article key={subscriber.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_140px_160px] md:items-center">
                      <div>
                        <h2 className="font-bold text-[var(--foreground)]">{subscriber.email}</h2>
                        <p className="mt-1 text-xs text-[var(--muted)]">{subscriber.is_registered ? 'Registered account subscriber' : 'Newsletter-only subscriber'}</p>
                      </div>
                      <ContentStatusBadge status="published">Active</ContentStatusBadge>
                      <span className="text-sm text-[var(--muted)]">Joined {formatDate(subscriber.created_at)}</span>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <ConfirmationModal
        isOpen={confirmSend}
        title="Send newsletter campaign?"
        message={`Sending this newsletter will deliver it to ${selectedEmails.length} selected active subscriber${selectedEmails.length === 1 ? '' : 's'}.`}
        confirmText="Send Campaign"
        cancelText="Cancel"
        variant="primary"
        isLoading={sending}
        onConfirm={sendCampaign}
        onCancel={() => setConfirmSend(false)}
      />

      {previewCampaign && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="campaign-preview-title" className="flex h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 id="campaign-preview-title" className="text-lg font-bold text-[var(--foreground)]">{previewCampaign.subject}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Sent {formatDate(previewCampaign.sent_at || previewCampaign.created_at)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close campaign preview" onClick={() => setPreviewCampaign(null)}><X className="h-4 w-4" /></Button>
            </header>
            <iframe title="sent campaign preview" srcDoc={previewHtml(previewCampaign.content)} className="min-h-0 flex-1 bg-white" />
          </section>
        </div>
      )}
    </main>
  );
}
