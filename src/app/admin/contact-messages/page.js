'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Building, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Search, 
  ArrowLeft, 
  ChevronRight,
  ShieldAlert,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import DOMPurify from 'dompurify';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

// Dynamically import pre-made QuillEditor to avoid Next.js Server-Side Rendering (SSR) issues
const QuillEditor = dynamic(() => import('../../../components/ui/QuillEditor'), { 
  ssr: false,
  loading: () => <div className="h-44 bg-zinc-150 dark:bg-zinc-900/50 animate-pulse rounded-xl border border-zinc-200 dark:border-zinc-800" />
});

function MessageRow({ msg, isExpanded, onToggle, onStatusUpdate, formatDate }) {
  const { toast } = useToast();
  const [replySubject, setReplySubject] = useState(`Re: ScholarlyNest Inquiry - ${msg.subject}`);
  const [replyBody, setReplyBody] = useState('');
  const [replyMode, setReplyMode] = useState('visual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  // Sync reply subject if original subject changes
  useEffect(() => {
    setReplySubject(`Re: ScholarlyNest Inquiry - ${msg.subject}`);
  }, [msg.subject]);

  // Utility to determine if rich-text HTML content is empty
  const isEmptyHtml = (html) => {
    if (!html) return true;
    const clean = html.replace(/<[^>]*>/g, '').trim();
    return clean === '';
  };

  const sanitizeHTML = (html) => {
    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(html);
    }
    return html;
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replySubject.trim() || isEmptyHtml(replyBody)) {
      toast('Subject and response content are required.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post(`/admin/contact-messages/${msg.id}/reply`, {
        subject: replySubject,
        message: replyBody
      });
      toast('Reply sent and saved successfully!', 'success');
      onStatusUpdate(msg.id, res.data.reply, res.data.contact_message);
      setReplyBody('');
      setShowComposer(false);
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.message || 'Failed to send response.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-[#121211] border rounded-2xl transition-all duration-300 shadow-sm overflow-hidden ${
        isExpanded ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/20' : 'border-zinc-200/80 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Header row click area */}
      <div 
        onClick={onToggle}
        className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
      >
        <div className="flex items-start space-x-3.5 overflow-hidden flex-grow">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isExpanded ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-450'
          }`}>
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="overflow-hidden space-y-1 flex-grow">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{msg.name}</h3>
              <span className="text-[10px] text-zinc-455 dark:text-zinc-500 font-medium">({msg.email})</span>
              {msg.affiliation && (
                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-[var(--accent-gold)] bg-[var(--accent-gold)]/5 px-2 py-0.5 rounded border border-[var(--accent-gold)]/10">
                  <Building className="w-2.5 h-2.5 mr-1" />
                  {msg.affiliation}
                </span>
              )}
              {/* Status Badge */}
              {msg.status === 'replied' ? (
                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-emerald-650 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle className="w-2.5 h-2.5 mr-1" />
                  Replied
                </span>
              ) : (
                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-amber-655 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                  Pending
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                {msg.subject.replace('-', ' ')}
              </span>
              <span className="text-[10px] text-zinc-450">•</span>
              <p className="text-[11px] text-zinc-555 dark:text-zinc-400 line-clamp-1 font-medium">{msg.message}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 shrink-0">
          <div className="flex items-center space-x-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(msg.created_at)}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Expanded Details section */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800/40 pt-5 space-y-5 bg-zinc-50/50 dark:bg-black/10 animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Sender Profile</h4>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{msg.name}</p>
              <p className="text-zinc-500 mt-0.5">{msg.email}</p>
              {msg.affiliation && <p className="text-zinc-500 mt-0.5">{msg.affiliation}</p>}
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Subject</h4>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{msg.subject.replace('-', ' ')}</p>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-2 mb-0.5">Received At</h4>
              <p className="text-zinc-500 font-mono">{formatDate(msg.created_at)}</p>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Message Content</h4>
            <div className="p-4 rounded-xl bg-white dark:bg-[#121211] border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line font-medium text-left">
              {msg.message}
            </div>
          </div>

          {/* Conversation Thread History */}
          {msg.replies && msg.replies.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 text-left">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Correspondence Thread</h4>
              <div className="space-y-3.5 pl-3.5 border-l-2 border-[var(--accent)]/30">
                {msg.replies.map((reply) => (
                  <div 
                    key={reply.id} 
                    className="bg-white dark:bg-[#161615] p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-bold text-[9px]">
                          {reply.user?.name ? reply.user.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          {reply.user?.name || 'Admin'} <span className="text-zinc-400 font-normal">({reply.user?.email})</span>
                        </span>
                      </div>
                      <span className="text-zinc-450 dark:text-zinc-500 font-mono">{formatDate(reply.created_at)}</span>
                    </div>
                    <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Subject: {reply.subject}
                    </div>
                    {/* Render raw HTML reply content safely sanitized */}
                    <div 
                      className="text-[11px] font-medium text-zinc-650 dark:text-zinc-400 leading-relaxed pl-1 ql-editor-preview"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(reply.message) }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Composer Form */}
          {showComposer ? (
            <form onSubmit={handleSendReply} className="space-y-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 animate-in fade-in slide-in-from-bottom-2 duration-200 text-left">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400">Compose Support Response</h4>
                <button 
                  type="button" 
                  onClick={() => setShowComposer(false)}
                  className="text-[10px] font-bold text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Email Subject</label>
                  <input 
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#121211] border border-zinc-200 dark:border-zinc-800/65 rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors text-zinc-850 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Response Content</label>
                    {/* Reply Mode Toggler */}
                    <div className="flex items-center space-x-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setReplyMode('visual')}
                        className={`text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          replyMode === 'visual'
                            ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] pb-0.5'
                            : 'text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300'
                        }`}
                      >
                        Visual Editor
                      </button>
                      <span className="text-zinc-300 dark:text-zinc-700">|</span>
                      <button
                        type="button"
                        onClick={() => setReplyMode('html')}
                        className={`text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          replyMode === 'html'
                            ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] pb-0.5'
                            : 'text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-300'
                        }`}
                      >
                        Raw HTML Body
                      </button>
                    </div>
                  </div>
                  
                  {replyMode === 'visual' ? (
                    /* Styled Quill Rich Text Editor */
                    <div className="quill-editor-wrapper bg-white dark:bg-[#121211] border border-zinc-200 dark:border-zinc-800/65 rounded-xl overflow-hidden text-zinc-850 dark:text-zinc-200">
                      <QuillEditor 
                        value={replyBody}
                        onChange={setReplyBody}
                        placeholder="Write your rich text response here..."
                      />
                    </div>
                  ) : (
                    <div className="min-h-[180px] flex flex-col relative">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="<!-- Response HTML content -->"
                        rows={8}
                        style={{ color: '#ffffff' }}
                        className="w-full flex-grow font-mono text-xs p-4 bg-zinc-900 text-white border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Response</span>
                    </>
                  )}
                </button>
              </div>

              {/* Injected custom styles for the Quill editor */}
              <style>{`
                .quill-editor-wrapper .ql-toolbar.ql-snow {
                  border: none !important;
                  border-bottom: 1px solid #e4e4e7 !important;
                  background: #f9f9fb;
                }
                .dark .quill-editor-wrapper .ql-toolbar.ql-snow {
                  background: #1a1a19;
                  border-bottom-color: #27272a !important;
                }
                .quill-editor-wrapper .ql-container.ql-snow {
                  border: none !important;
                  min-height: 180px;
                  font-size: 13px;
                }
                .quill-editor-wrapper .ql-editor {
                  min-height: 180px;
                }
                .dark .ql-snow .ql-stroke {
                  stroke: #e4e4e7 !important;
                }
                .dark .ql-snow .ql-fill {
                  fill: #e4e4e7 !important;
                }
                .dark .ql-snow .ql-picker {
                  color: #e4e4e7 !important;
                }
                .dark .ql-snow .ql-picker-options {
                  background-color: #1a1a19 !important;
                  border-color: #27272a !important;
                }
                .ql-editor-preview p {
                  margin-bottom: 8px;
                }
                .ql-editor-preview ul {
                  list-style-type: disc;
                  padding-left: 20px;
                  margin-bottom: 8px;
                }
                .ql-editor-preview ol {
                  list-style-type: decimal;
                  padding-left: 20px;
                  margin-bottom: 8px;
                }
                .ql-editor-preview blockquote {
                  border-left: 4px solid #10b981;
                  padding-left: 12px;
                  color: #71717a;
                  font-style: italic;
                  margin-bottom: 8px;
                }
              `}</style>
            </form>
          ) : (
            <div className="flex items-center justify-end pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setShowComposer(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Compose Reply</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContactMessagesAdmin() {
  const { toast } = useToast();
  const { user, hasPermission, loading: authLoading } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!hasPermission('settings.view-any') && !hasPermission('settings.manage')) return;
      try {
        setLoading(true);
        const res = await api.get('/admin/contact-messages');
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to load contact messages:', err);
        toast('Failed to load contact messages.', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && user) {
      fetchMessages();
    }
  }, [user, authLoading]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStatusUpdate = (messageId, newReply, updatedMessage) => {
    setMessages(prevMessages => 
      prevMessages.map(m => {
        if (m.id === messageId) {
          const replies = m.replies ? [...m.replies, newReply] : [newReply];
          return { ...m, ...updatedMessage, replies };
        }
        return m;
      })
    );
  };

  const filteredMessages = messages.filter((msg) => {
    const term = searchTerm.toLowerCase();
    return (
      msg.name.toLowerCase().includes(term) ||
      msg.email.toLowerCase().includes(term) ||
      (msg.affiliation && msg.affiliation.toLowerCase().includes(term)) ||
      msg.subject.toLowerCase().includes(term) ||
      msg.message.toLowerCase().includes(term)
    );
  });

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

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
      </div>
    );
  }

  if (!user || (!hasPermission('settings.view-any') && !hasPermission('settings.manage'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess settings management privileges to view contact messages.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Loading Contact Ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left">
      {/* Navigation Headers */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
        <Link href="/admin" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Overview
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>Console</span>
          <ChevronRight className="w-3 h-3 text-[var(--accent-gold)]" />
          <span className="text-zinc-650 dark:text-zinc-300">Contact Messages</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white dark:bg-[#121211] p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--accent)]/5 to-transparent pointer-events-none" />
        <div>
          <h1 className="text-xl font-bold text-zinc-950 dark:text-white font-serif">Contact Inquiries Ledger</h1>
          <p className="text-xs text-zinc-555 dark:text-zinc-400 font-medium mt-1">
            Review academic inquiries, partnership requests, and feedback submitted by site visitors.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64 shrink-0">
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/65 rounded-lg text-xs font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length > 0 ? (
        <div className="space-y-3">
          {filteredMessages.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              isExpanded={expandedId === msg.id}
              onToggle={() => toggleExpand(msg.id)}
              onStatusUpdate={handleStatusUpdate}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-[#121211] border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl shadow-sm text-zinc-450 dark:text-zinc-500 space-y-2">
          <MessageSquare className="w-10 h-10 mx-auto text-zinc-350 dark:text-zinc-600" />
          <p className="text-xs font-bold uppercase tracking-wider">No Submissions Found</p>
          <p className="text-[11px] font-medium max-w-xs mx-auto">
            {searchTerm ? 'No results matched your search term.' : 'Inquiries sent via the public contact form will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
}
