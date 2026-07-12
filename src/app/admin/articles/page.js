'use client';

import { logError } from '../../../utils/safeLogger';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  FileText, Loader2, Eye, Calendar, User, AlertCircle,
  BookOpen, Download, ShieldAlert, Plus, Edit,
  Search, ChevronDown, X
} from 'lucide-react';
import api from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/AuthContext';
import Pagination from '../../../components/ui/Pagination';
import PublishArticleModal from '../../../components/admin/PublishArticleModal';
import DeskObserverContext from '../../../components/admin/desk-observer/DeskObserverContext';
import {
  PUBLISHABLE_STATUSES,
  STATUS_META,
  STATUS_TONE_CLASSES,
} from '../../../components/admin/articleWorkflow';
import {
  ARTICLE_QUEUE_PARAM,
  ARTICLE_QUEUE_TABS,
  DEFAULT_ARTICLE_QUEUE_ID,
  getArticleQueue,
  isValidArticleQueue,
} from '../../../utils/articleQueues';
import { isArticleEditableStatus } from '../../../utils/status';
import { uploadAndAwaitClean } from '../../../lib/mediaUploads/DirectUploadClient';

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

const AUTHOR_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  screening: 'Screening',
  in_transit: 'In Transit',
  under_review: 'Under review',
  assigned_to_sub_editor: 'Under review',
  reviewer_assigned: 'Under review',
  review_in_progress: 'Under review',
  revision_required: 'Revision required',
  minor_revision_required: 'Minor revision required',
  major_revision_required: 'Major revision required',
  resubmitted: 'Resubmitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  copy_editing: 'In production',
  proofreading: 'In production',
  ready_for_publication: 'Ready for publication',
  published: 'Published',
  withdrawn: 'Withdrawn',
  archived: 'Archived',
};

const REVISION_STATUSES = new Set(['revision_required', 'minor_revision_required', 'major_revision_required']);
const AUTHOR_MANUSCRIPT_STATUSES = [
  'draft',
  'revision_required',
  'minor_revision_required',
  'major_revision_required',
  'submitted',
  'screening',
  'under_review',
  'assigned_to_sub_editor',
  'reviewer_assigned',
  'review_in_progress',
  'resubmitted',
  'accepted',
  'copy_editing',
  'proofreading',
  'ready_for_publication',
  'published',
];

const groupStatusOptionsByLabel = (options) => {
  const grouped = new Map();
  options.forEach((option) => {
    const label = option.label || AUTHOR_STATUS_LABELS[option.value] || option.value;
    const existing = grouped.get(label) || {
      label,
      values: [],
      count: 0,
    };
    existing.values.push(option.value);
    existing.count += Number(option.count || 0);
    grouped.set(label, existing);
  });

  return Array.from(grouped.values()).map((option) => ({
    value: option.values.join(','),
    label: option.label,
    count: option.count,
  }));
};

function AuthorManuscriptWorkspace({ articles, loading, error, getStatusBadge }) {
  const groups = [
    {
      id: 'drafts',
      title: 'Drafts',
      emptyTitle: 'No drafts yet',
      emptyDescription: 'Start a new submission and save it as a draft when you are not ready to submit.',
      filter: (article) => article.status === 'draft',
    },
    {
      id: 'revisions',
      title: 'Revision Requests',
      emptyTitle: 'No revision requests right now',
      emptyDescription: 'Manuscripts needing author revision will appear here.',
      filter: (article) => REVISION_STATUSES.has(article.status),
    },
    {
      id: 'submitted',
      title: 'Submitted Manuscripts',
      emptyTitle: 'No submitted manuscripts yet',
      emptyDescription: 'Submitted and in-review manuscripts will appear here after final submission.',
      filter: (article) => ['submitted', 'screening', 'under_review', 'assigned_to_sub_editor', 'reviewer_assigned', 'review_in_progress', 'resubmitted', 'accepted', 'copy_editing', 'proofreading', 'ready_for_publication'].includes(article.status),
    },
    {
      id: 'published',
      title: 'Published',
      emptyTitle: 'No published manuscripts yet',
      emptyDescription: 'Published manuscripts will appear here once they are available publicly.',
      filter: (article) => article.status === 'published',
    },
  ];

  const primaryAction = (article) => {
    const canEdit = article.can_edit_article !== false && isArticleEditableStatus(article.status);
    if (canEdit && article.status === 'draft') {
      return { label: 'Continue Draft', href: `/admin/articles/${article.id}/edit`, icon: Edit };
    }
    if (canEdit && REVISION_STATUSES.has(article.status)) {
      return { label: 'Respond to Revision Request', href: `/admin/articles/${article.id}/edit`, icon: Edit };
    }
    if (canEdit && article.status === 'ready_for_publication') {
      return { label: 'Update Publication Details', href: `/admin/articles/${article.id}/edit`, icon: Edit };
    }
    if (canEdit) {
      return { label: 'Edit Manuscript', href: `/admin/articles/${article.id}/edit`, icon: Edit };
    }
    if (article.status === 'published') {
      return { label: 'View Published Article', href: `/admin/articles/${article.id}/workflow`, icon: Eye };
    }
    return { label: 'View Submission Status', href: `/admin/articles/${article.id}/workflow`, icon: Eye };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 border border-zinc-200/80 rounded-2xl bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Loading My Manuscripts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-red-500/[0.04] border border-red-500/10 rounded-xl text-red-650 text-xs">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="font-semibold text-xs leading-none">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const items = articles.filter(group.filter);
        return (
          <section key={group.id} aria-labelledby={`author-manuscripts-${group.id}`} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id={`author-manuscripts-${group.id}`} className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                {group.title}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{items.length} total</span>
            </div>
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-white/70 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
                <FileText className="mx-auto mb-3 h-6 w-6 text-zinc-350" />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-150">{group.emptyTitle}</h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-zinc-500">{group.emptyDescription}</p>
                {group.id === 'drafts' && (
                  <Link href="/admin/articles/new" className="mt-4 inline-flex">
                    <Button type="button" variant="secondary" size="sm" icon={Plus}>Start a New Submission</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {items.map((article) => {
                  const action = primaryAction(article);
                  const ActionIcon = action.icon;
                  return (
                    <article key={article.id} className="rounded-xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm transition hover:border-amber-500/30 dark:border-zinc-850 dark:bg-zinc-900/30">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(article.status)}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{AUTHOR_STATUS_LABELS[article.status] || 'Manuscript'}</span>
                          </div>
                          <h3 className="text-base font-bold leading-snug text-zinc-950 dark:text-white">{article.title}</h3>
                          <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                              {article.magazine?.title || 'Magazine not selected'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                              Updated {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : 'recently'}
                            </span>
                          </div>
                          {article.abstract && (
                            <p className="line-clamp-2 max-w-3xl text-xs leading-relaxed text-zinc-500">
                              {article.abstract.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                            </p>
                          )}
                        </div>
                        <Link
                          href={action.href}
                          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"
                        >
                          <ActionIcon className="h-4 w-4" />
                          {action.label}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function AdminArticlesBoardContent({ observerMode = false, observerParams = {} }) {
  const { toast } = useToast();
  const { user, hasPermission, hasRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEditor = hasRole('editor');
  const isMagazineEditor = hasRole('magazine_editor');
  const isJournalEditor = hasRole('journal_editor');

  const isAdminOrEditor = hasPermission ? (hasPermission('articles.approve') || hasPermission('articles.auto-approve') || isEditor) : false;
  const isAuthorWorkspace = !isAdminOrEditor;

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const rawQueueParam = searchParams.get(ARTICLE_QUEUE_PARAM);
  const queueId = rawQueueParam && isValidArticleQueue(rawQueueParam) ? rawQueueParam : DEFAULT_ARTICLE_QUEUE_ID;
  const selectedQueue = getArticleQueue(queueId);

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
      if (publishData.publication_pdf) {
        const pdfUpload = await uploadAndAwaitClean({
          file: publishData.publication_pdf,
          purpose: 'article_published_pdf',
          attachableId: articleToPublish.id,
        });
        payload.append('publication_pdf_upload_id', pdfUpload.id);
      }

      await api.post(`/admin/articles/${articleToPublish.id}/publish`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast(`Article published successfully for ${publishData.published_month} ${publishData.published_year}.`, 'success');
      setIsPublishModalOpen(false);
      fetchArticles();
    } catch (err) {
      logError(err);
      toast('Failed to finalize article publication.', 'error');
    }
  };

  // Live search and magazine filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [authorFilter, setAuthorFilter] = useState(searchParams.get('author_id') || 'all');
  const [authorOptions, setAuthorOptions] = useState([]);
  const [selectedMagazineId, setSelectedMagazineId] = useState(searchParams.get('magazine_id') || 'all');
  const defaultPublicationType = isMagazineEditor ? 'magazine' : isJournalEditor ? 'journal' : 'all';
  const [publicationType, setPublicationType] = useState(searchParams.get('publication_type') || defaultPublicationType);
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [magazines, setMagazines] = useState([]);
  const [loadingMagazines, setLoadingMagazines] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loadingStatusOptions, setLoadingStatusOptions] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all' || (key === ARTICLE_QUEUE_PARAM && value === DEFAULT_ARTICLE_QUEUE_ID)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    if (updates[ARTICLE_QUEUE_PARAM]) next.delete('status');
    next.delete('page');
    const queryString = next.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (nextUrl !== currentUrl) router.push(nextUrl, { scroll: false });
  };

  const handleQueueChange = (nextQueueId) => {
    updateQuery({ [ARTICLE_QUEUE_PARAM]: isValidArticleQueue(nextQueueId) ? nextQueueId : DEFAULT_ARTICLE_QUEUE_ID });
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if ((searchParams.get('search') || '') !== searchQuery.trim()) {
        updateQuery({ search: searchQuery.trim() });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const nextSearch = searchParams.get('search') || '';
    const nextMagazineId = searchParams.get('magazine_id') || 'all';
    const nextStatus = searchParams.get('status') || 'all';
    setAuthorFilter(searchParams.get('author_id') || 'all');
    setSearchQuery(nextSearch);
    setDebouncedSearchQuery(nextSearch);
    setSelectedMagazineId(nextMagazineId);
    setPublicationType(searchParams.get('publication_type') || defaultPublicationType);
    setSelectedStatus(nextStatus);
  }, [defaultPublicationType, searchParams]);

  useEffect(() => {
    const fetchAuthorOptions = async () => {
      if (isAuthorWorkspace || authLoading || !user) return;
      try {
        const params = { ...observerParams };
        if (selectedMagazineId !== 'all') params.magazine_id = selectedMagazineId;
        const response = await api.get('/admin/articles/filter-options', { params });
        setAuthorOptions(response.data?.authors || []);
      } catch (err) {
        logError('Failed to fetch article author filter options', err);
        setAuthorOptions([]);
      }
    };
    fetchAuthorOptions();
  }, [isAuthorWorkspace, authLoading, user, selectedMagazineId, observerParams]);

  // Fetch magazines for the filter dropdown
  useEffect(() => {
    const fetchMagazines = async () => {
      try {
        setLoadingMagazines(true);
        const endpoint = isAuthorWorkspace ? '/magazines' : '/admin/magazines';
        const response = await api.get(endpoint, { params: { all: true } });
        setMagazines(Array.isArray(response.data) ? response.data : (response.data?.data || []));
      } catch (err) {
        logError('Failed to fetch magazines for filter', err);
      } finally {
        setLoadingMagazines(false);
      }
    };
    fetchMagazines();
  }, [isAuthorWorkspace]);

  useEffect(() => {
    const fetchStatusOptions = async () => {
      if (!isAuthorWorkspace || authLoading || !user) return;
      try {
        setLoadingStatusOptions(true);
        const params = { ...observerParams };
        if (selectedMagazineId !== 'all') {
          params.magazine_id = selectedMagazineId;
        }
        if (debouncedSearchQuery.trim()) {
          params.search = debouncedSearchQuery.trim();
        }
        const response = await api.get('/admin/articles/status-options', { params });
        const options = groupStatusOptionsByLabel(response.data?.data || []);
        setStatusOptions(options);
        if (selectedStatus !== 'all' && !options.some((option) => option.value === selectedStatus)) {
          setSelectedStatus('all');
          updateQuery({ status: 'all' });
        }
      } catch (err) {
        logError('Failed to fetch article status filter options', err);
        setStatusOptions([]);
      } finally {
        setLoadingStatusOptions(false);
      }
    };
    fetchStatusOptions();
  }, [isAuthorWorkspace, authLoading, user, selectedMagazineId, debouncedSearchQuery, observerParams]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedMagazineId, selectedStatus, queueId, authorFilter, publicationType]);

  // Fetch articles based on filter
  const fetchArticles = async () => {
    if (!hasPermission('articles.view-any') && !hasPermission('articles.view-own')) return;
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        ...observerParams,
      };

      if (selectedMagazineId !== 'all') {
        params.magazine_id = selectedMagazineId;
      }
      if (publicationType !== 'all') {
        params.publication_type = publicationType;
      }
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }
      ['author_id'].forEach((key) => {
        const value = searchParams.get(key);
        if (value) params[key] = value;
      });

      if (isAuthorWorkspace) {
        if (selectedStatus !== 'all') {
          params.status = selectedStatus;
        }
        const response = await api.get('/admin/articles', { params });
        setArticles(response.data?.data || []);
        setTotalArticles(response.data?.total || response.data?.data?.length || 0);
        setTotalPages(response.data?.last_page || 1);
        return;
      }

      const statuses = selectedQueue.statuses.length ? selectedQueue.statuses : [null];
      const perStatusPage = Math.max(1, Math.ceil(itemsPerPage / statuses.length));
      const responses = await Promise.all(statuses.map((status) => {
        const nextParams = { ...params, per_page: perStatusPage };
        if (status) nextParams.status = status;
        return api.get('/admin/articles', { params: nextParams });
      }));
      const combinedResults = responses.flatMap((response) => response.data?.data || []);
      const combined = combinedResults.slice(0, itemsPerPage);
      const total = responses.reduce((sum, response) => sum + (response.data?.total || response.data?.data?.length || 0), 0);
      const pages = Math.max(...responses.map((response) => response.data?.last_page || 1));
      
      setArticles(combined);
      setTotalArticles(total);
      setTotalPages(pages);
    } catch (err) {
      logError(err);
      setError('Could not download the articles registry database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchArticles();
    }
  }, [currentPage, queueId, selectedMagazineId, selectedStatus, debouncedSearchQuery, user, authLoading, observerParams, publicationType, searchParams]);

  const getStatusBadge = (status) => {
    const [label, tone = 'zinc'] = STATUS_META[status] || [(status || 'Unknown').replaceAll('_', ' '), 'zinc'];
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono uppercase border ${STATUS_TONE_CLASSES[tone] || STATUS_TONE_CLASSES.zinc}`}>
        {label}
      </span>
    );
  };

  const getAbsoluteFileUrl = (art) => {
    if (!art?.has_pdf) return '';
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
            {isAdminOrEditor ? selectedQueue.heading : "My Manuscripts"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {isAdminOrEditor
              ? selectedQueue.description
              : "Filter your manuscript submissions by magazine, workflow status, or search text."}
          </p>
        </div>
        {hasPermission('articles.create') && !observerMode && (
          <Link href="/admin/articles/new" className="self-start sm:self-auto">
            <Button
              variant="primary"
              size="sm"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAuthorWorkspace ? "New Submission" : "Add Article"}</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Tabs & Search row */}
      <div className="flex flex-col justify-between gap-5 font-sans">
        {isAdminOrEditor && (
          <div
            role="tablist"
            aria-label="Article queues"
            className="flex flex-wrap gap-1 rounded-xl p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 w-full lg:max-w-5xl"
          >
            {ARTICLE_QUEUE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`article-queue-tab-${tab.id}`}
                aria-controls="article-queue-panel"
                aria-selected={queueId === tab.id}
                onClick={() => handleQueueChange(tab.id)}
                className={`px-3 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100 dark:focus-visible:ring-offset-zinc-900 ${
                  queueId === tab.id
                    ? 'bg-white shadow text-amber-600 dark:bg-zinc-950 dark:text-amber-400'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Inputs */}
        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-end">
          <div className="relative w-full sm:w-[28rem] sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-405" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAuthorWorkspace ? 'Search my manuscripts...' : 'Search tracking code, title, issue, or author...'}
              className="w-full text-xs font-semibold pl-9 pr-8 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 p-0.5 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!isAuthorWorkspace && (
            <select value={publicationType} onChange={(event) => { setPublicationType(event.target.value); setSelectedMagazineId('all'); updateQuery({ publication_type: event.target.value, magazine_id: 'all' }); }} aria-label="Filter by publication type" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 sm:w-48">
              {!isMagazineEditor && !isJournalEditor && <option value="all">All Publications</option>}
              {!isJournalEditor && <option value="magazine">Magazines</option>}
              {!isMagazineEditor && <option value="journal">Journals</option>}
            </select>
          )}

          {!isAuthorWorkspace && (
            <select value={authorFilter} onChange={(event) => { setAuthorFilter(event.target.value); updateQuery({ author_id: event.target.value }); }} aria-label="Filter by author" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 sm:w-56">
              <option value="all">All Authors</option>
              {authorOptions.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
            </select>
          )}

          {isAuthorWorkspace && (
            <div className="relative w-full sm:w-56">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  updateQuery({ status: e.target.value });
                }}
                disabled={loadingStatusOptions}
                className="w-full text-xs font-semibold pl-3 pr-8 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100 cursor-pointer appearance-none disabled:cursor-wait disabled:text-zinc-400"
              >
                <option value="all">All Statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          )}

          {/* Magazine selector */}
          <div className="relative w-full sm:w-56">
            <select
              value={selectedMagazineId}
              onChange={(e) => {
                setSelectedMagazineId(e.target.value);
                updateQuery({ magazine_id: e.target.value });
              }}
              className="w-full text-xs font-semibold pl-3 pr-8 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-zinc-900 dark:text-zinc-100 cursor-pointer appearance-none"
            >
              <option value="all">All Destinations</option>
              {magazines.filter((m) => publicationType === 'all' || m.publication_type === publicationType).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div
        id="article-queue-panel"
        role="tabpanel"
        aria-labelledby={`article-queue-tab-${queueId}`}
      >
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
                  <th className="px-6 py-4">Publication</th>
                  {isAdminOrEditor && <th className="px-6 py-4">Author Details</th>}
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850/60 text-xs font-semibold text-zinc-700 dark:text-zinc-305">
                {articles.map((art) => {
                  const canEditArticle = art.can_edit_article !== false && isArticleEditableStatus(art.status);
                  return (
                  <tr key={art.id} className="hover:bg-amber-500/[0.01] transition-colors">
                    <td className="px-6 py-4 max-w-[340px]">
                      <div className="flex items-center space-x-3.5 text-left">
                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-zinc-200/80 dark:border-zinc-800/85 bg-zinc-50 flex items-center justify-center">
                          {(art.featured_image_url || art.featured_image || art.magazine?.cover_image_url || art.magazine?.cover_image) ? (
                            <img 
                              src={art.featured_image_url || art.magazine?.cover_image_url || getFullImageUrl(art.featured_image || art.magazine?.cover_image)}
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        {/* Title details */}
                        <div className="space-y-1 min-w-0 flex-grow">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 truncate leading-snug font-serif" title={art.title}>{art.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-zinc-400 font-semibold font-mono uppercase tracking-wider">
                            {(art.latest_tracking_code || art.tracking_code) && (
                              <span className="px-1.5 py-0.5 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-650 dark:text-zinc-300 rounded font-bold border border-zinc-200/50 dark:border-zinc-700/50">
                                {art.latest_tracking_code || art.tracking_code}
                              </span>
                            )}
                            {art.latest_revision_number && (
                              <span className="px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 font-bold text-amber-700 dark:text-amber-300">
                                Revision {art.latest_revision_number}
                              </span>
                            )}
                            <div className="flex items-center space-x-1 shrink-0">
                              <Calendar className="w-3 h-3" />
                              <span>{art.latest_revision_number ? 'Latest submission' : 'Submitted'}: {new Date(art.latest_submission_at || art.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 font-bold text-[9px] uppercase text-zinc-650 dark:text-zinc-300">
                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>{art.publication_label || (art.publication_type === 'journal' ? 'Journal' : 'Magazine')} · {art.publication_name || art.magazine?.title}</span>
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
                      {hasPermission('articles.edit-own') && canEditArticle && !observerMode && (
                        <Link
                          href={`/admin/articles/${art.id}/edit`}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-blue-605 hover:underline cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                      )}

                      {isAdminOrEditor && !isEditor && !observerMode && PUBLISHABLE_STATUSES.has(art.status) && (
                        <button
                          onClick={() => openPublishModal(art)}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase text-purple-650 hover:underline cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </button>
                      )}

                      <Link
                        href={observerMode ? `/admin/articles/${art.id}/workflow?observer_readonly=1` : `/admin/articles/${art.id}/workflow`}
                        className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase text-amber-600 hover:underline cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{observerMode ? "View Record" : isAdminOrEditor ? "Manage Workflow" : "View Workflow"}</span>
                      </Link>

                      {art.has_pdf && (
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
                  );
                })}
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
      </div>

      <PublishArticleModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSubmit={handlePublishSubmit}
        articleTitle={articleToPublish?.title}
        articleAbstract={articleToPublish?.abstract || ''}
        magazineId={articleToPublish?.magazine_id}
        publicationSections={articleToPublish?.publication_sections || []}
      />

    </div>
  );
}

export default function AdminArticlesBoard() {
  return (
    <DeskObserverContext roles={['editor']}>
      {({ observerMode, observerParams }) => (
        <AdminArticlesBoardContent
          observerMode={observerMode}
          observerParams={observerParams}
        />
      )}
    </DeskObserverContext>
  );
}
