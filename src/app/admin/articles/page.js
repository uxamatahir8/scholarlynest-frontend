'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Check, X, AlertCircle, Loader2, Eye, Calendar, User, 
  BookOpen, Download, ShieldAlert, ArrowRight, MessageSquare, Plus, Edit, Save
} from 'lucide-react';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { useAuth } from '../../../context/AuthContext';

export default function AdminArticlesBoard() {
  const { toast } = useToast();
  const { user, hasPermission, loading: authLoading } = useAuth();

  const isAdminOrEditor = hasPermission('articles.approve');

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Status filter state: 'all' | 'pending' | 'approved' | 'rejected'
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected article for review modal
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState('abstract'); // 'abstract' | 'fulltext'
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch articles based on filter
  const fetchArticles = async () => {
    if (!hasPermission('articles.view-any') && !hasPermission('articles.view-own')) return;
    try {
      setLoading(true);
      setError(null);
      
      const queryParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.get(`/admin/articles${queryParam}`);
      setArticles(response.data);
    } catch (err) {
      console.error(err);
      setError('Could not download the articles registry database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchArticles();
    }
  }, [statusFilter, user, authLoading]);

  const openReviewModal = (article) => {
    setSelectedArticle(article);
    setRejectionReason('');
    setActiveReviewTab('abstract');
    setIsReviewModalOpen(true);
  };

  const handleReviewAction = async (status) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast('Please supply a reason for rejecting this publication.', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const payload = {
        status,
        rejection_reason: status === 'rejected' ? rejectionReason : null
      };

      await api.patch(`/admin/articles/${selectedArticle.id}/review`, payload);
      
      toast(`Article review updated to: ${status}.`, 'success');
      setIsReviewModalOpen(false);
      fetchArticles();
    } catch (err) {
      console.error(err);
      toast('Failed to record review determination.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-red-500/10 text-red-500 border border-red-500/20">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-605 border border-amber-500/20">
            Pending Review
          </span>
        );
    }
  };

  const getAbsoluteFileUrl = (art) => {
    if (!art?.pdf_path) return '';
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    return `${baseApiUrl}/articles/${art.id}/download-pdf`;
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
      </div>
    );
  }

  if (!user || (!hasPermission('articles.view-any') && !hasPermission('articles.view-own'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess article viewing privileges to access this registry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <title>{isAdminOrEditor ? "Manuscripts Board - ScholarlyNest" : "My Articles - ScholarlyNest"}</title>
      
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {isAdminOrEditor ? "Manuscripts Editorial Board" : "My Research Articles"}
          </h1>
          <p className="text-xs text-[var(--muted)] font-medium mt-1">
            {isAdminOrEditor 
              ? "Review and process research paper submissions, drafts, and PDF generation pipelines." 
              : "Manage your article drafts, track review status, and publish new articles."}
          </p>
        </div>
        {hasPermission('articles.create') && (
          <Link href="/admin/articles/new">
            <Button
              variant="primary"
              size="sm"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Article</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex rounded-xl p-1 bg-black/5 dark:bg-white/5 border border-[var(--muted-border)]/60 max-w-md">
        {['all', 'pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`flex-1 py-2 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              statusFilter === tab
                ? 'bg-[var(--background)] shadow-md text-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main workspace listing */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 glass-panel border border-[var(--muted-border)]/60 rounded-2xl bg-[var(--card-bg)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] dark:text-blue-400" />
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest font-mono">Loading Publications Ledger...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-650 dark:text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-xs leading-none">{error}</span>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-20 glass-panel border border-[var(--muted-border)]/60 rounded-2xl bg-[var(--card-bg)]">
          <FileText className="w-12 h-12 mx-auto text-[var(--muted)] mb-3 opacity-55" />
          <p className="text-xs font-semibold text-[var(--muted)]">No articles match the selected filter query.</p>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md overflow-hidden animate-in fade-in duration-300">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--muted-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  <th className="px-6 py-4">Article Details</th>
                  <th className="px-6 py-4">Magazine Issues</th>
                  {isAdminOrEditor && <th className="px-6 py-4">Author Details</th>}
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--muted-border)]/50 text-xs font-semibold text-[var(--foreground)]">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-[var(--foreground)]/5 transition-colors">
                    <td className="px-6 py-4 space-y-1 max-w-[280px]">
                      <h4 className="text-sm font-bold text-[var(--foreground)] line-clamp-1">{art.title}</h4>
                      <div className="flex items-center space-x-2 text-[10px] text-[var(--muted)] font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Submitted on {new Date(art.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[var(--background)] border border-[var(--muted-border)]/60 font-bold text-[10px] uppercase text-[var(--foreground)]">
                        <BookOpen className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                        <span>{art.magazine?.title}</span>
                      </span>
                    </td>
                    {isAdminOrEditor && (
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="font-bold text-[var(--foreground)] flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-[var(--muted)] opacity-60" />
                          <span>{art.user?.name}</span>
                        </div>
                        <p className="text-[10px] text-[var(--muted)] font-mono font-medium">{art.user?.email}</p>
                      </td>
                    )}
                    <td className="px-6 py-4">{getStatusBadge(art.status)}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {hasPermission('articles.edit-own') && (
                        <Link
                          href={`/admin/articles/${art.id}/edit`}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-blue-500 dark:text-blue-450 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                      )}

                      <button
                        onClick={() => openReviewModal(art)}
                        className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase text-[var(--accent)] dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{isAdminOrEditor ? "Review" : "View"}</span>
                      </button>

                      {art.pdf_path && (
                        <a
                          href={getAbsoluteFileUrl(art)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-emerald-500 dark:text-emerald-450 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* REVIEW DETAILS & TRANSITION MODAL */}
      {isReviewModalOpen && selectedArticle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel bg-[var(--card-bg)] text-[var(--foreground)] rounded-2xl border border-[var(--muted-border)] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--muted-border)]/60 flex items-center justify-between bg-black/5 dark:bg-white/5">
              <div className="space-y-1 text-left">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] font-mono">Submission Review Center</h3>
                <p className="text-[11px] text-[var(--muted)] font-medium">Issue: {selectedArticle.magazine?.title}</p>
              </div>
              <button 
                onClick={() => setIsReviewModalOpen(false)} 
                className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow flex flex-col min-h-[400px]">
              
              {/* Title Header */}
              <div className="space-y-2 pb-4 border-b border-[var(--muted-border)]/40 text-left">
                <h2 className="text-lg font-bold text-[var(--foreground)] leading-snug">{selectedArticle.title}</h2>
                <div className="flex items-center space-x-4 text-[10px] text-[var(--muted)] font-medium">
                  <span className="flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-[var(--accent-gold)]" />
                    Submitted by: {selectedArticle.user?.name}
                  </span>
                  <span>•</span>
                  <span>Date: {new Date(selectedArticle.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Segment Tab Controls */}
              <div className="flex rounded-xl p-1 bg-black/5 dark:bg-white/5 border border-[var(--muted-border)]/60 max-w-sm self-start">
                <button
                  type="button"
                  onClick={() => setActiveReviewTab('abstract')}
                  className={`px-4 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeReviewTab === 'abstract'
                      ? 'bg-[var(--background)] shadow-md text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Abstract
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReviewTab('fulltext')}
                  className={`px-4 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeReviewTab === 'fulltext'
                      ? 'bg-[var(--background)] shadow-md text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Full Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReviewTab('share_stats')}
                  className={`px-4 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeReviewTab === 'share_stats'
                      ? 'bg-[var(--background)] shadow-md text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Share Analytics
                </button>
              </div>

              {/* Reader Panel */}
              <div className="flex-grow p-5 rounded-xl border border-[var(--muted-border)]/65 bg-[var(--background)]/40 text-left overflow-y-auto max-h-[320px]">
                {activeReviewTab === 'abstract' ? (
                  <div className="prose prose-sm max-w-none text-[var(--foreground)]/80 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedArticle.abstract }} />
                ) : activeReviewTab === 'fulltext' ? (
                  <div className="prose prose-sm max-w-none text-[var(--foreground)] leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedArticle.full_text }} />
                ) : (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Social Sharing Metric Summary</h4>
                        <p className="text-[10px] text-[var(--muted)]">Real-time click engagement for share links and embeds</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-[var(--accent)]">
                          {selectedArticle.share_clicks?.reduce((acc, curr) => acc + curr.clicks, 0) || 0}
                        </span>
                        <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-[var(--muted)]">Total Shares</p>
                      </div>
                    </div>

                    {!selectedArticle.share_clicks || selectedArticle.share_clicks.length === 0 ? (
                      <p className="text-xs italic text-[var(--muted)] py-6 text-center">No sharing interactions logged yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedArticle.share_clicks.map((item) => (
                          <div key={item.id} className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)] block font-mono">{item.platform.replace('_', ' ')}</span>
                              <span className="text-xs font-bold text-[var(--foreground)] mt-0.5 block">{item.clicks} clicks</span>
                            </div>
                            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] opacity-40 shrink-0"></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Review workflow choices (Only show actions if article is pending review AND user is admin/editor) */}
              {selectedArticle.status === 'pending' ? (
                isAdminOrEditor ? (
                  <div className="pt-4 border-t border-[var(--muted-border)]/60 space-y-4 text-left">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Editorial Determination</h4>
                      <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5">Record review feedback. If rejecting, a justification must be supplied.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] font-mono block">Rejection Comments / Feedback</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Required only for rejections. Enter editorial feedback here..."
                        rows={2}
                        className="w-full text-xs font-semibold px-3 py-2 bg-[var(--background)] border border-[var(--muted-border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-3">
                      <button
                        type="button"
                        disabled={submittingReview}
                        onClick={() => handleReviewAction('rejected')}
                        className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject manuscript</span>
                      </button>
                      
                      <button
                        type="button"
                        disabled={submittingReview}
                        onClick={() => handleReviewAction('approved')}
                        className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Approve & Compile PDF</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-[var(--muted-border)]/60 space-y-3 text-left">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Review Status</h4>
                      <div className="mt-2">
                        {getStatusBadge(selectedArticle.status)}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="pt-4 border-t border-[var(--muted-border)]/60 space-y-3 text-left">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Archived Review Result</h4>
                    <div className="mt-2 flex items-center space-x-2">
                      {getStatusBadge(selectedArticle.status)}
                      {selectedArticle.status === 'rejected' && (
                        <p className="text-xs text-[var(--muted)] font-medium">Reason: {selectedArticle.rejection_reason || 'No comments left.'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
