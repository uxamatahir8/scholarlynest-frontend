'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Users,
  Send,
  Eye,
  History,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Check,
  X,
  FileText,
  Search,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export default function NewsletterAdmin() {
  const { toast } = useToast();
  const { user, hasPermission, loading: authLoading } = useAuth();

  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Tab control
  const [activeTab, setActiveTab] = useState('compose'); // compose, history, subscribers

  // Compose form states
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('<p>Dear Scholar,</p>\n<p>We are delighted to share our latest research developments and publications with our academic community.</p>\n<p>In this digest, we cover:</p>\n<ul>\n  <li><strong>Breakthrough Manuscripts:</strong> Exploring newly peer-reviewed and published works.</li>\n  <li><strong>Editor Selections:</strong> Curated papers of outstanding scientific significance.</li>\n  <li><strong>Upcoming Issues:</strong> Sneak previews of our forthcoming ScholarlyNest volume.</li>\n</ul>\n<p>We thank you for your continued support and collaboration in advancing open-access research.</p>\n<p>Sincerely,<br><strong>ScholarlyNest Editorial Board</strong></p>');
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  // Modals / Ledger previews
  const [previewCampaign, setPreviewCampaign] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Recipient selection states
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalTab, setModalTab] = useState('only_subscribers');

  useEffect(() => {
    if (subscribers.length > 0) {
      setSelectedEmails(subscribers.map(s => s.email));
    }
  }, [subscribers]);

  const handleToggleSelectEmail = (email) => {
    setSelectedEmails(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    setSelectedEmails(subscribers.map(s => s.email));
  };

  const handleDeselectAll = () => {
    setSelectedEmails([]);
  };

  // Fetch subscribers & campaigns
  const fetchData = async () => {
    if (!hasPermission('newsletters.view-any')) return;
    try {
      setLoading(true);
      const [subRes, campRes] = await Promise.all([
        api.get('/admin/newsletter/subscribers'),
        api.get('/admin/newsletter/campaigns')
      ]);
      setSubscribers(subRes.data || []);
      setCampaigns(campRes.data || []);
    } catch (err) {
      console.error('Failed to load newsletter data:', err);
      toast('Failed to load newsletter subscriber lists or campaigns.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast('Subject line is required.', 'error');
      return;
    }
    if (!content.trim()) {
      toast('Campaign HTML content body is required.', 'error');
      return;
    }
    if (subscribers.length === 0) {
      toast('No active subscribers found. Cannot send campaign.', 'error');
      return;
    }

    try {
      setSending(true);
      setShowConfirmSend(false);
      const res = await api.post('/admin/newsletter/send', {
        subject,
        content,
        recipients: selectedEmails
      });
      toast(res.data?.message || 'Campaign successfully dispatched to all subscribers!', 'success');
      setSubject('');
      // Reset default template
      setContent('<p>Dear Scholar,</p>\n<p>We are delighted to share our latest research developments and publications with our academic community.</p>\n<p>In this digest, we cover:</p>\n<ul>\n  <li><strong>Breakthrough Manuscripts:</strong> Exploring newly peer-reviewed and published works.</li>\n  <li><strong>Editor Selections:</strong> Curated papers of outstanding scientific significance.</li>\n  <li><strong>Upcoming Issues:</strong> Sneak previews of our forthcoming ScholarlyNest volume.</li>\n</ul>\n<p>We thank you for your continued support and collaboration in advancing open-access research.</p>\n<p>Sincerely,<br><strong>ScholarlyNest Editorial Board</strong></p>');
      // Refresh list
      await fetchData();
    } catch (err) {
      console.error('Failed to dispatch campaign:', err);
      toast(err.response?.data?.message || 'Failed to dispatch newsletter campaign.', 'error');
    } finally {
      setSending(false);
    }
  };

  const getPreviewHtml = (bodyContent) => {
    const unsubscribeUrl = "https://dev.scholarlynest.com/api/newsletter/unsubscribe/sample-token";
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Roboto', sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background-color: #18181b; padding: 20px; text-align: center; }
          .header h2 { color: #ffffff; font-family: 'Roboto', sans-serif; margin: 0; font-size: 18px; letter-spacing: 0.05em; }
          .content { padding: 24px; font-size: 14px; line-height: 1.6; color: #18181b; }
          .footer { background-color: #fafafa; padding: 20px; font-size: 11px; text-align: center; color: #71717a; border-top: 1px solid #f4f4f5; }
          .unsubscribe-link { color: #3b82f6; text-decoration: underline; display: inline-block; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>ScholarlyNest Press</h2>
          </div>
          <div class="content">
            ${bodyContent || '<p style="color: #a1a1aa; font-style: italic;">Start typing template body to preview...</p>'}
          </div>
          <div class="footer">
            You are receiving this because you subscribed to the ScholarlyNest newsletter.<br>
            <a href="${unsubscribeUrl}" class="unsubscribe-link">Unsubscribe from this list</a>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
      </div>
    );
  }

  if (!user || !hasPermission('newsletters.view-any')) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess newsletter management privileges to view and compile campaigns.
          </p>
        </div>
      </div>
    );
  }

  if (loading && subscribers.length === 0 && campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Loading Campaigns & Subscribers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left relative">
      {/* Navigation Headers */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
        <Link href="/admin" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Overview
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Console</span>
          <ChevronRight className="w-3 h-3 text-[var(--accent-gold)]" />
          <span className="text-zinc-650 dark:text-zinc-300">Newsletter Manager</span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-[#121211] p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--accent)]/5 to-transparent pointer-events-none" />
        <div>
          <h1 className="text-xl font-bold text-zinc-950 dark:text-white font-serif">Newsletter Campaigns & Mailing Lists</h1>
          <p className="text-xs text-zinc-555 dark:text-zinc-400 font-medium mt-1">
            Compose and transmit premium broadcast campaigns to subscribers, manage opt-ins, and inspect historical metrics.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 px-4 py-2.5 rounded-xl flex items-center space-x-3 shadow-sm">
            <Users className="w-4.5 h-4.5 text-[var(--accent-gold)]" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Subscribers</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">{subscribers.length}</div>
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 px-4 py-2.5 rounded-xl flex items-center space-x-3 shadow-sm">
            <Mail className="w-4.5 h-4.5 text-[var(--accent)]" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Campaigns Sent</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">{campaigns.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800/50">
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${activeTab === 'compose'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-zinc-450 hover:text-zinc-850 dark:hover:text-zinc-200'
            }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Compose Campaign</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${activeTab === 'history'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-zinc-450 hover:text-zinc-850 dark:hover:text-zinc-200'
            }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Sent Campaigns History ({campaigns.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${activeTab === 'subscribers'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-zinc-450 hover:text-zinc-850 dark:hover:text-zinc-200'
            }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Subscribers List ({subscribers.length})</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-[#121211] border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden p-6">

        {/* TAB 1: COMPOSE */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Form Column */}
            <form onSubmit={(e) => { e.preventDefault(); setShowConfirmSend(true); }} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Campaign Editor</h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ScholarlyNest Quarterly Journal Update"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60 rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors placeholder-zinc-400"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Email HTML Content
                  </label>
                  <span className="text-[9px] text-zinc-400 font-medium font-mono">HTML tags are supported</span>
                </div>
                <textarea
                  rows={14}
                  required
                  placeholder="Enter HTML tags and paragraphs..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs font-mono p-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/60 rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors placeholder-zinc-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={sending || subscribers.length === 0}
                className="w-full flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-950 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Email Broadcast...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Newsletter Campaign</span>
                  </>
                )}
              </button>

              {subscribers.length === 0 && (
                <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Mailing list is currently empty. You must accumulate subscribers before sending campaigns.</span>
                </div>
              )}
            </form>

            {/* Realtime Live Preview Column */}
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center space-x-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Real-time Live Preview</span>
                </h3>
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 border border-zinc-200 dark:border-zinc-800/60 rounded">Client View</span>
              </div>
              <div className="border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl overflow-hidden h-[420px] bg-zinc-100 dark:bg-zinc-950/40 shadow-inner p-2">
                <iframe
                  title="live-preview"
                  srcDoc={getPreviewHtml(content)}
                  className="w-full h-full rounded-xl border-none bg-white"
                />
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SENT CAMPAIGNS LEDGER */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Broadcast Transmissions Ledger</h3>

            {campaigns.length > 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800/50">
                      <th className="p-4">Campaign Subject</th>
                      <th className="p-4">Recipients</th>
                      <th className="p-4">Date Transmitted</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 font-medium">
                    {campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{camp.subject}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded font-bold">
                            {camp.recipient_count} accounts
                          </span>
                        </td>
                        <td className="p-4 text-zinc-500 font-mono">{formatDate(camp.created_at)}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setPreviewCampaign(camp)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview HTML</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-450 dark:text-zinc-500 space-y-2 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-2xl">
                <History className="w-9 h-9 mx-auto text-zinc-350 dark:text-zinc-650" />
                <p className="text-xs font-bold uppercase tracking-wider">No campaigns sent yet</p>
                <p className="text-[11px] font-medium max-w-xs mx-auto">
                  When you transmit a newsletter campaign to your mailing list, it will appear here in the history ledger.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBSCRIBERS LIST */}
        {activeTab === 'subscribers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Subscriber Directory</h3>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filter subscribers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/65 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors placeholder-zinc-500"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {filteredSubscribers.length > 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold uppercase tracking-widest text-[9px] border-b border-zinc-200 dark:border-zinc-800/50">
                      <th className="p-4">Subscriber Email</th>
                      <th className="p-4">Security Opt-in Token</th>
                      <th className="p-4">Date Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 font-medium">
                    {filteredSubscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{sub.email}</td>
                        <td className="p-4 text-zinc-400 font-mono text-[10px] truncate max-w-[200px]">{sub.token}</td>
                        <td className="p-4 text-zinc-500 font-mono">{formatDate(sub.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-450 dark:text-zinc-500 space-y-2 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-2xl">
                <Users className="w-9 h-9 mx-auto text-zinc-350 dark:text-zinc-650" />
                <p className="text-xs font-bold uppercase tracking-wider">No subscribers found</p>
                <p className="text-[11px] font-medium max-w-xs mx-auto">
                  {searchTerm ? 'No subscribers match the current filter.' : 'Mailing list is empty. Users can subscribe via footer forms or registration opt-ins.'}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CONFIRM SEND DIALOG MODAL */}
      {showConfirmSend && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121211] border border-zinc-200 dark:border-zinc-800 max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-4 text-left flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white">Select Broadcast Recipients</h3>
              <button
                type="button"
                onClick={() => setShowConfirmSend(false)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-555 dark:text-zinc-400 leading-relaxed font-medium shrink-0">
              Select which newsletter subscribers should receive this email campaign. You can filter and toggle individual recipients.
            </p>

            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search recipients..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--accent)] text-zinc-900 dark:text-zinc-100"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider rounded-lg text-zinc-755 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider rounded-lg text-zinc-755 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800/50 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('only_subscribers')}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${modalTab === 'only_subscribers'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-zinc-450 hover:text-zinc-755 dark:hover:text-white'
                  }`}
              >
                Only Subscribers ({subscribers.filter(s => !s.is_registered).length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('users_subscribed')}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${modalTab === 'users_subscribed'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-zinc-450 hover:text-zinc-755 dark:hover:text-white'
                  }`}
              >
                Users Who Subscribed ({subscribers.filter(s => s.is_registered).length})
              </button>
            </div>

            {/* Modal Subscriber list */}
            <div className="flex-grow overflow-y-auto min-h-[200px] border border-zinc-200 dark:border-zinc-850 rounded-xl p-2 space-y-1 bg-zinc-50/50 dark:bg-zinc-950/20">
              {(() => {
                const targetList = subscribers.filter(s =>
                  modalTab === 'only_subscribers' ? !s.is_registered : s.is_registered
                ).filter(s =>
                  s.email.toLowerCase().includes(modalSearchTerm.toLowerCase())
                );

                if (targetList.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-450 dark:text-zinc-555 text-xs">
                      No recipients found matching current filters.
                    </div>
                  );
                }

                return targetList.map(sub => {
                  const isChecked = selectedEmails.includes(sub.email);
                  const roleDisplayName = (r) => {
                    const name = typeof r === 'object' ? r?.name : r;
                    const normalized = name?.toLowerCase().replace('_', '-');
                    if (normalized === 'super_admin') return 'Super Admin';
                    if (normalized === 'admin') return 'Admin';
                    if (normalized === 'editor') return 'Journal Editor';
                    if (normalized === 'author') return 'Research Author';
                    return name || '';
                  };
                  const roleString = sub.roles && sub.roles.length > 0
                    ? ` [${sub.roles.map(r => roleDisplayName(r)).filter(Boolean).join(', ')}]`
                    : '';

                  return (
                    <label
                      key={sub.id}
                      className={`flex items-center space-x-3 p-2.5 rounded-lg border transition-all cursor-pointer ${isChecked
                          ? 'bg-[var(--accent)]/5 border-[var(--accent)]/20'
                          : 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/40'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectEmail(sub.email)}
                        className="w-4.5 h-4.5 rounded border-zinc-350 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                      />
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-150 flex items-center gap-1.5 flex-wrap">
                        <span>{sub.email}</span>
                        {roleString && (
                          <span className="text-[10px] text-[var(--accent-gold)] font-bold uppercase">
                            {roleString}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                });
              })()}
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800/80 rounded-lg text-xs font-semibold text-zinc-500 shrink-0">
              Campaign Subject: <strong className="text-zinc-900 dark:text-white font-serif">{subject}</strong>
            </div>

            <div className="flex items-center justify-between pt-2 shrink-0">
              <span className="text-xs font-bold text-zinc-500">
                Selected: <strong className="text-zinc-900 dark:text-white">{selectedEmails.length}</strong> / {subscribers.length} recipients
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmSend(false)}
                  className="px-4 py-2 border border-zinc-250 dark:border-zinc-850 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCampaign}
                  disabled={selectedEmails.length === 0 || sending}
                  className="px-4 py-2 bg-red-650 hover:bg-red-755 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {sending ? 'Sending...' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGN HISTORICAL PREVIEW MODAL */}
      {previewCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121211] border border-zinc-200 dark:border-zinc-800 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] text-left">
            <div className="p-5 border-b border-zinc-150 dark:border-zinc-850 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-white">Historical Broadcast Preview</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{previewCampaign.subject}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCampaign(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all border border-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-grow p-4 bg-zinc-50 dark:bg-zinc-950/40 shadow-inner">
              <iframe
                title="campaign-historical-preview"
                srcDoc={getPreviewHtml(previewCampaign.content)}
                className="w-full h-full rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white"
              />
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-150 dark:border-zinc-850 flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">
              <span>Recipients: {previewCampaign.recipient_count} subscribers</span>
              <span>Transmitted: {formatDate(previewCampaign.created_at)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
