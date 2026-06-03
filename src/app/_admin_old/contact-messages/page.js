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
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

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
          {filteredMessages.map((msg) => {
            const isExpanded = expandedId === msg.id;
            return (
              <div 
                key={msg.id}
                className={`bg-white dark:bg-[#121211] border rounded-2xl transition-all duration-300 shadow-sm overflow-hidden ${
                  isExpanded ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/20' : 'border-zinc-200/80 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Header row click area */}
                <div 
                  onClick={() => toggleExpand(msg.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start space-x-3.5 overflow-hidden flex-grow">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isExpanded ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-450'
                    }`}>
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{msg.name}</h3>
                        <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">({msg.email})</span>
                        {msg.affiliation && (
                          <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-[var(--accent-gold)] bg-[var(--accent-gold)]/5 px-2 py-0.5 rounded border border-[var(--accent-gold)]/10">
                            <Building className="w-2.5 h-2.5 mr-1" />
                            {msg.affiliation}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                          {msg.subject.replace('-', ' ')}
                        </span>
                        <span className="text-[10px] text-zinc-400">•</span>
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
                  <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800/40 pt-5 space-y-4 bg-zinc-50/50 dark:bg-black/10 animate-in slide-in-from-top-1 duration-200">
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
                      <div className="p-4 rounded-xl bg-white dark:bg-[#121211] border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line font-medium">
                        {msg.message}
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <a
                        href={`mailto:${msg.email}?subject=Re: ScholarlyNest Inquiry - ${msg.subject}`}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Reply via Email</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
