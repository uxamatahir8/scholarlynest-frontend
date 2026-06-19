'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Check, X, AlertCircle, Loader2, Eye, Calendar, User, 
  BookOpen, Download, ShieldAlert, ArrowRight, MessageSquare, Plus, Edit, Save,
  Search, ChevronDown
} from 'lucide-react';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { useAuth } from '../../../context/AuthContext';
import Pagination from '../../../components/ui/Pagination';
import PublishArticleModal from '../../../components/admin/PublishArticleModal';
import WorkflowActionPanel from '../../../components/admin/WorkflowActionPanel';
import {
  PUBLISHABLE_STATUSES,
  REJECTED_STATUSES,
  REVIEWABLE_STATUSES,
  REVISION_STATUSES,
  STATUS_FILTERS,
  STATUS_LABELS,
  STATUS_META,
  STATUS_TONE_CLASSES,
} from '../../../components/admin/articleWorkflow';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/images/') || path.startsWith('images/')) {
    return path.startsWith('/') ? path : '/' + path;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${domain}${cleanPath}`;
};

export default function AdminArticlesBoard() {
  const { toast } = useToast();
  const { user, hasPermission, hasRole, loading: authLoading } = useAuth();
  const isEditor = hasRole('editor') || hasRole('magazine_editor') || hasRole('magazine-editor');

  const isAdminOrEditor = hasPermission ? (hasPermission('articles.approve') || hasPermission('articles.auto-approve') || isEditor) : false;

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Status filter state: 'all' | pipeline statuses
  const [statusFilter, setStatusFilter] = useState('all');

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [articleToPublish, setArticleToPublish] = useState(null);

  const openPublishModal = (article) => {
    setArticleToPublish(article);
    setIsPublishModalOpen(true);
  };

  const handlePublishSubmit = async (publishData) => {
    try {
      const payload = new FormData();
      payload.append('published_year', publishData.published_year);
      payload.append('published_month', publishData.published_month);
      if (publishData.magazine_issue_id) payload.append('magazine_issue_id', publishData.magazine_issue_id);
      if (publishData.doi) payload.append('doi', publishData.doi);
      if (publishData.page_start) payload.append('page_start', publishData.page_start);
      if (publishData.page_end) payload.append('page_end', publishData.page_end);
      if (publishData.publication_pdf) payload.append('publication_pdf', publishData.publication_pdf);

      await api.post(`/admin/articles/${articleToPublish.id}/publish`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast(`Article published successfully for ${publishData.published_month} ${publishData.published_year}.`, 'success');
      setIsPublishModalOpen(false);
      fetchArticles();
    } catch (err) {
      console.error(err);
      toast('Failed to finalize article publication.', 'error');
    }
  };

  // Live search and magazine filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMagazineId, setSelectedMagazineId] = useState('all');
  const [magazines, setMagazines] = useState([]);
  const [loadingMagazines, setLoadingMagazines] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch magazines for the filter dropdown
  useEffect(() => {
    const fetchMagazines = async () => {
      try {
        setLoadingMagazines(true);
        const response = await api.get('/magazines', { params: { all: true } });
        setMagazines(response.data || []);
      } catch (err) {
        console.error('Failed to fetch magazines for filter', err);
      } finally {
        setLoadingMagazines(false);
      }
    };
    fetchMagazines();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedMagazineId, statusFilter]);

  // Selected article for review modal
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [workflowContext, setWorkflowContext] = useState(null);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState('abstract'); // 'abstract' | 'fulltext' | 'share_stats'
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isRejectionDropdownOpen, setIsRejectionDropdownOpen] = useState(false);

  // Fetch articles based on filter
  const fetchArticles = async () => {
    if (!hasPermission('articles.view-any') && !hasPermission('articles.view-own')) return;
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (selectedMagazineId !== 'all') {
        params.magazine_id = selectedMagazineId;
      }
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }

      const response = await api.get('/admin/articles', { params });
      
      if (response.data && response.data.data) {
        setArticles(response.data.data);
        setTotalArticles(response.data.total || 0);
        setTotalPages(response.data.last_page || 1);
      } else {
        setArticles(Array.isArray(response.data) ? response.data : []);
        setTotalArticles(Array.isArray(response.data) ? response.data.length : 0);
        setTotalPages(1);
      }
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
  }, [currentPage, statusFilter, selectedMagazineId, debouncedSearchQuery, user, authLoading]);

  const openReviewModal = async (article) => {
    setSelectedArticle(article);
    setWorkflowContext(null);
    setRejectionReason('');
    setActiveReviewTab('abstract');
    setIsRejectionDropdownOpen(false);
    setIsReviewModalOpen(true);
    setLoadingWorkflow(true);
    try {
      const res = await api.get(`/admin/articles/${article.id}/workflow`);
      const nextArticle = res.data?.article ? { ...res.data.article, files: res.data.files || res.data.article.files || [] } : null;
      setWorkflowContext(nextArticle);
    } catch (err) {
      console.error('Failed to load workflow context', err);
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const refreshWorkflowContext = async () => {
    const articleId = selectedArticle?.id || workflowContext?.id;
    if (!articleId) return;

    const res = await api.get(`/admin/articles/${articleId}/workflow`);
    const nextArticle = res.data?.article ? { ...res.data.article, files: res.data.files || res.data.article.files || [] } : null;
    setWorkflowContext(nextArticle);
    if (nextArticle) {
      setSelectedArticle((prev) => ({ ...prev, ...nextArticle }));
    }
    fetchArticles();
  };

  const handleReviewAction = async (status) => {
    if (['revision_required', 'minor_revision_required', 'major_revision_required', 'rejected'].includes(status) && !rejectionReason.trim()) {
      toast('Please supply feedback for this decision.', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const payload = {
        status,
        rejection_reason: ['revision_required', 'minor_revision_required', 'major_revision_required', 'rejected'].includes(status) ? rejectionReason : null
      };

      await api.patch(`/admin/articles/${selectedArticle.id}/review`, payload);
      
      toast(`Article review updated to: ${STATUS_LABELS[status] || status}.`, 'success');
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
    const [label, tone = 'zinc'] = STATUS_META[status] || [(status || 'Unknown').replaceAll('_', ' '), 'zinc'];
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono uppercase border ${STATUS_TONE_CLASSES[tone] || STATUS_TONE_CLASSES.zinc}`}>
        {label}
      </span>
    );
  };

  const getAbsoluteFileUrl = (art) => {
    if (!art?.pdf_path) return '';
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    return `${baseApiUrl}/articles/${art.id}/download-pdf`;
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-605" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
      </div>
    );
  }

  if (!user || (!hasPermission('articles.view-any') && !hasPermission('articles.view-own'))) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start space-x-4 animate-in fade-in">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-750">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-350 mt-1">
            You must possess article viewing privileges to access this registry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left font-sans">
      <title>{isAdminOrEditor ? "Manuscripts Board - ScholarlyNest" : "My Articles - ScholarlyNest"}</title>
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
            {isAdminOrEditor ? "Manuscripts Editorial Board" : "My Research Articles"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {isAdminOrEditor 
              ? "Oversee platform submissions, review papers, and download manuscript files." 
              : "Manage drafts, track editorial review cycles, and publish new academic work."}
          </p>
        </div>
        {hasPermission('articles.create') && (
          <Link href="/admin/articles/new" className="self-start sm:self-auto">
            <Button
              variant="primary"
              size="sm"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Article</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Tabs & Search row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 font-sans">
        {/* Status selection */}
        <div className="flex flex-wrap gap-1 rounded-xl p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 w-full lg:max-w-5xl">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white shadow text-amber-600 dark:bg-zinc-950 dark:text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-405" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registry..."
              className="w-full text-xs font-semibold pl-9 pr-8 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Magazine selector */}
          <div className="relative w-full sm:w-56">
            <select
              value={selectedMagazineId}
              onChange={(e) => setSelectedMagazineId(e.target.value)}
              className="w-full text-xs font-semibold pl-3 pr-8 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100 cursor-pointer appearance-none"
            >
              <option value="all">All Magazines</option>
              {magazines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 border border-zinc-200/80 rounded-2xl bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/20 backdrop-blur-md">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Loading Publications Ledger...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-500/[0.04] border border-red-500/10 rounded-xl text-red-650 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-xs leading-none">{error}</span>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-20 border border-zinc-200/80 rounded-2xl bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/20 backdrop-blur-md">
          <FileText className="w-10 h-10 mx-auto text-zinc-350 mb-3 opacity-60" />
          <p className="text-xs font-semibold text-zinc-450">No manuscripts match the selected search or filter criteria.</p>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="border border-zinc-200/80 dark:border-zinc-850 bg-white/70 dark:bg-zinc-900/20 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] font-sans">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-150 dark:border-zinc-850 text-[10px] font-bold uppercase tracking-wider text-zinc-455">
                  <th className="px-6 py-4">Article Details</th>
                  <th className="px-6 py-4">Magazine Issues</th>
                  {isAdminOrEditor && <th className="px-6 py-4">Author Details</th>}
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850/60 text-xs font-semibold text-zinc-700 dark:text-zinc-305">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-amber-500/[0.01] transition-colors">
                    <td className="px-6 py-4 max-w-[340px]">
                      <div className="flex items-center space-x-3.5 text-left">
                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-zinc-200/80 dark:border-zinc-800/85 bg-zinc-50 flex items-center justify-center">
                          {(art.featured_image || art.magazine?.cover_image) ? (
                            <img 
                              src={getFullImageUrl(art.featured_image || art.magazine?.cover_image)} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        {/* Title details */}
                        <div className="space-y-0.5 min-w-0 flex-grow">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 truncate leading-snug font-serif" title={art.title}>{art.title}</h4>
                          <div className="flex items-center space-x-1.5 text-[9px] text-zinc-400 font-semibold font-mono uppercase tracking-wider">
                            <Calendar className="w-3 h-3" />
                            <span>Submitted: {new Date(art.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 font-bold text-[9px] uppercase text-zinc-650 dark:text-zinc-300">
                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>{art.magazine?.title}</span>
                      </span>
                    </td>
                    {isAdminOrEditor && (
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-zinc-405" />
                          <span>{art.user?.name}</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 font-mono font-medium">{art.user?.email}</p>
                      </td>
                    )}
                    <td className="px-6 py-4">{getStatusBadge(art.status)}</td>
                    <td className="px-6 py-4 text-right space-x-3.5">
                      {hasPermission('articles.edit-own') && !isEditor && (
                        <Link
                          href={`/admin/articles/${art.id}/edit`}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-blue-605 hover:underline cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                      )}

                      {isAdminOrEditor && !isEditor && PUBLISHABLE_STATUSES.has(art.status) && (
                        <button
                          onClick={() => openPublishModal(art)}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-purple-650 hover:underline cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </button>
                      )}

                      <button
                        onClick={() => openReviewModal(art)}
                        className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase text-amber-600 hover:underline cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{isAdminOrEditor ? "Review" : "View"}</span>
                      </button>

                      {art.pdf_path && (
                        <a
                          href={getAbsoluteFileUrl(art)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-emerald-600 hover:underline cursor-pointer"
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
          </div>

          {/* Table Footer with Pagination Controls */}
          <div className="px-6 py-4 border-t border-zinc-150 dark:border-zinc-850/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-550/[0.01] text-xs font-semibold text-zinc-450 font-sans">
            <div className="flex items-center space-x-4">
              <span>Total Articles: <strong className="text-zinc-800 dark:text-zinc-200">{totalArticles}</strong></span>
              <span className="h-4 w-px bg-zinc-150 dark:bg-zinc-800 hidden sm:inline" />
              <span>
                {totalArticles === 0 ? (
                  "Showing 0-0 of 0"
                ) : (
                  <>
                    Showing <strong className="text-zinc-800 dark:text-zinc-200">{(currentPage - 1) * itemsPerPage + 1}</strong> -{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">{Math.min(currentPage * itemsPerPage, totalArticles)}</strong> of{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">{totalArticles}</strong>
                  </>
                )}
              </span>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* REVIEW DETAILS MODAL OVERLAY */}
      {isReviewModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsReviewModalOpen(false)}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
          />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] font-sans">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-zinc-150 dark:border-zinc-850/80 flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Submission Review Center</span>
                <p className="text-xs text-zinc-900 dark:text-white font-bold leading-none">Issue: {selectedArticle.magazine?.title}</p>
              </div>
              <button 
                onClick={() => setIsReviewModalOpen(false)} 
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-105 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow flex flex-col min-h-[350px]">
              
              {/* Title Section */}
              <div className="space-y-1.5 pb-4 border-b border-zinc-100 dark:border-zinc-850 text-left">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-snug font-serif">{selectedArticle.title}</h2>
                <div className="flex items-center space-x-3 text-[10px] text-zinc-450 font-bold uppercase tracking-wider">
                  <span className="flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Author: {selectedArticle.user?.name}
                  </span>
                  <span>•</span>
                  <span>Date: {new Date(selectedArticle.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Tabs controls */}
              <div className="flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850 w-full max-w-lg self-start">
                {['abstract', 'fulltext', 'workflow', 'share_stats'].map((tab) => {
                  const label = tab === 'abstract' ? 'Abstract' : tab === 'fulltext' ? 'Full Text' : tab === 'workflow' ? 'Workflow' : 'Share Metrics';
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveReviewTab(tab)}
                      className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeReviewTab === tab
                          ? 'bg-white shadow text-amber-600 dark:bg-zinc-900 dark:text-amber-400'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-250'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Reader Panel (using font-serif where appropriate) */}
              <div className="flex-grow p-5 rounded-xl border border-zinc-150 dark:border-zinc-850/80 bg-zinc-50/30 dark:bg-zinc-950/20 text-left overflow-y-auto max-h-[300px]">
                {activeReviewTab === 'abstract' ? (
                  <div className="space-y-4 font-serif">
                    {(selectedArticle.featured_image || selectedArticle.magazine?.cover_image) && (
                      <div className="w-full max-w-sm h-40 rounded-xl overflow-hidden border border-zinc-200/50 bg-zinc-50/50 shadow-sm mb-4">
                        <img 
                          src={getFullImageUrl(selectedArticle.featured_image || selectedArticle.magazine?.cover_image)} 
                          alt="Article Cover" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none text-zinc-700 dark:text-zinc-300 italic leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: selectedArticle.abstract }} />
                  </div>
                ) : activeReviewTab === 'fulltext' ? (
                  <div className="prose prose-sm max-w-none text-zinc-850 dark:text-zinc-350 leading-relaxed font-serif text-sm" dangerouslySetInnerHTML={{ __html: selectedArticle.full_text }} />
                ) : activeReviewTab === 'workflow' ? (
                  <div className="space-y-4 text-left font-sans">
                    {loadingWorkflow ? (
                      <div className="flex items-center space-x-2 text-xs text-zinc-450 font-semibold py-8 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                        <span>Loading workflow timeline...</span>
                      </div>
                    ) : (
                      <>
                        <WorkflowActionPanel
                          article={workflowContext || selectedArticle}
                          workflowContext={workflowContext}
                          user={user}
                          hasRole={hasRole}
                          hasPermission={hasPermission}
                          toast={toast}
                          onWorkflowChanged={refreshWorkflowContext}
                          onOpenPublish={() => openPublishModal(workflowContext || selectedArticle)}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850">
                            <h4 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">Sub Editors</h4>
                            {(workflowContext?.sub_editor_assignments || []).length === 0 ? (
                              <p className="text-xs text-zinc-450">No sub editor assigned.</p>
                            ) : workflowContext.sub_editor_assignments.map((item) => (
                              <div key={item.id} className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {item.sub_editor?.name || 'Sub Editor'} <span className="text-zinc-400">({item.status})</span>
                              </div>
                            ))}
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850">
                            <h4 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">Reviewers</h4>
                            {(workflowContext?.reviewer_assignments || []).length === 0 ? (
                              <p className="text-xs text-zinc-450">No reviewer assigned.</p>
                            ) : workflowContext.reviewer_assignments.map((item) => (
                              <div key={item.id} className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {item.reviewer?.name || 'Reviewer'} <span className="text-zinc-400">({item.status})</span>
                              </div>
                            ))}
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850">
                            <h4 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">Editorial Decisions</h4>
                            {(workflowContext?.editorial_decisions || []).length === 0 ? (
                              <p className="text-xs text-zinc-450">No final decision recorded.</p>
                            ) : workflowContext.editorial_decisions.map((item) => (
                              <div key={item.id} className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {item.decision?.replaceAll('_', ' ')} <span className="text-zinc-400">via {item.decision_source?.replaceAll('_', ' ')}</span>
                              </div>
                            ))}
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850">
                            <h4 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">Production</h4>
                            {(workflowContext?.production_assignments || []).length === 0 ? (
                              <p className="text-xs text-zinc-450">No production assignment.</p>
                            ) : workflowContext.production_assignments.map((item) => (
                              <div key={item.id} className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {item.role?.replaceAll('_', ' ')}: {item.user?.name || 'Assignee'} <span className="text-zinc-400">({item.status})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850">
                          <h4 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">Audit Trail</h4>
                          {(workflowContext?.audit_logs || []).length === 0 ? (
                            <p className="text-xs text-zinc-450">No workflow events recorded.</p>
                          ) : workflowContext.audit_logs.slice(0, 8).map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-850 last:border-0">
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{item.event?.replaceAll('_', ' ')}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">{new Date(item.created_at).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 text-left font-sans">
                    <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Sharing Metric Summary</h4>
                        <p className="text-[9px] text-zinc-400 font-semibold">Real-time click engagement metrics for share anchors</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                          {selectedArticle.share_clicks?.reduce((acc, curr) => acc + curr.clicks, 0) || 0}
                        </span>
                        <p className="text-[8px] uppercase tracking-wider font-bold text-zinc-400">Total clicks</p>
                      </div>
                    </div>

                    {!selectedArticle.share_clicks || selectedArticle.share_clicks.length === 0 ? (
                      <p className="text-xs italic text-zinc-450 py-6 text-center">No sharing interactions logged yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedArticle.share_clicks.map((item) => (
                          <div key={item.id} className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 flex items-center justify-between shadow-sm">
                            <div className="text-left">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-450 block font-mono">{item.platform.replace('_', ' ')}</span>
                              <span className="text-[11px] font-bold text-zinc-805 dark:text-zinc-250 mt-0.5 block">{item.clicks} clicks</span>
                            </div>
                            <span className="h-2 w-2 rounded-full bg-amber-500 opacity-40 shrink-0"></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>              {/* Review actions / comments */}
              {REVIEWABLE_STATUSES.has(selectedArticle.status) ? (
                isAdminOrEditor ? (
                  <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 space-y-4 text-left font-sans">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-455 font-mono">Editorial Verdict Form</h4>
                      <p className="text-[10px] text-zinc-455 font-medium">Record verdict. A reason must be written if rejecting this submission.</p>
                    </div>

                    {isEditor ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-405 font-mono block">
                            Editorial Review Feedback / Rejection Reason * <span className="text-red-500">(Required for Rejections)</span>
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Feedback written here is visible to authors..."
                            rows={3}
                            className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-905"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-2.5">
                          {/* Split dropdown menu trigger */}
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              disabled={submittingReview}
                              onClick={() => setIsRejectionDropdownOpen(!isRejectionDropdownOpen)}
                              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-655 bg-red-500/[0.04] border border-red-500/20 hover:bg-red-500/[0.08] transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <span>Issue Rejection</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {isRejectionDropdownOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setIsRejectionDropdownOpen(false)} 
                                />
                                <div className="absolute right-0 bottom-full mb-2 w-56 rounded-xl shadow-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 text-left">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsRejectionDropdownOpen(false);
                                      handleReviewAction('minor_revision_required');
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-605 hover:bg-amber-500/[0.04] flex items-center space-x-2 transition-colors cursor-pointer"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Minor Revisions</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsRejectionDropdownOpen(false);
                                      handleReviewAction('rejected');
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-505 hover:bg-red-500/[0.04] flex items-center space-x-2 transition-colors cursor-pointer border-t border-zinc-100 dark:border-zinc-900"
                                  >
                                    <X className="w-3.5 h-3.5 shrink-0" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={submittingReview}
                            onClick={() => handleReviewAction('accepted')}
                            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm transition-colors cursor-pointer disabled:opacity-50 font-sans"
                          >
                            {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            <span>Accept Manuscript</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-405 font-mono block">Rejection Feedback / Justification</label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Feedback written here is visible to authors..."
                            rows={2}
                            className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-905"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-2.5">
                          <button
                            type="button"
                            disabled={submittingReview}
                            onClick={() => handleReviewAction('minor_revision_required')}
                            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-500/[0.04] border border-amber-500/20 hover:bg-amber-500/[0.08] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <AlertCircle className="w-4 h-4" />
                            <span>Minor Revisions</span>
                          </button>

                          <button
                            type="button"
                            disabled={submittingReview}
                            onClick={() => handleReviewAction('rejected')}
                            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-655 bg-red-500/[0.04] border border-red-500/20 hover:bg-red-500/[0.08] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                          
                          <button
                            type="button"
                            disabled={submittingReview}
                            onClick={() => handleReviewAction('accepted')}
                            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm transition-colors cursor-pointer disabled:opacity-50 font-sans"
                          >
                            {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            <span>Accept & Compile PDF</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 text-left font-sans">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Review Status</h4>
                    <div className="mt-2">
                      {getStatusBadge(selectedArticle.status)}
                    </div>
                  </div>
                )
              ) : (
                <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 text-left font-sans">
                  <h4 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Historical Record</h4>
                  <div className="mt-2 flex items-center space-x-3">
                    {getStatusBadge(selectedArticle.status)}
                    {(REVISION_STATUSES.has(selectedArticle.status) || REJECTED_STATUSES.has(selectedArticle.status)) && (
                      <p className="text-xs text-zinc-500 font-medium">Rejection Reason: <strong className="text-zinc-900 dark:text-zinc-200">{selectedArticle.rejection_reason || 'None provided.'}</strong></p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <PublishArticleModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSubmit={handlePublishSubmit}
        articleTitle={articleToPublish?.title}
        magazineId={articleToPublish?.magazine_id}
      />

    </div>
  );
}
