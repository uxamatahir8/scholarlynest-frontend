'use client';

import { safeApiMessage } from '../../../../../utils/safeErrors';
import { logError } from '../../../../../utils/safeLogger';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  History,
  Loader2,
  MessageSquare,
  Newspaper,
  ShieldAlert,
  User,
} from 'lucide-react';
import api from '../../../../../utils/api';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import WorkflowActionPanel from '../../../../../components/admin/WorkflowActionPanel';
import PublishArticleModal from '../../../../../components/admin/PublishArticleModal';
import { PUBLISHABLE_STATUSES, STATUS_LABELS, STATUS_META, STATUS_TONE_CLASSES } from '../../../../../components/admin/articleWorkflow';

const workflowSteps = [
  { id: 'draft', label: 'Draft', statuses: ['draft'] },
  { id: 'submitted', label: 'Submitted', statuses: ['pending', 'submitted'] },
  { id: 'screening', label: 'Screening', statuses: ['under_review'] },
  { id: 'sub_editor', label: 'Sub Editor Review', statuses: ['assigned_to_sub_editor'] },
  { id: 'reviewer', label: 'Reviewer Review', statuses: ['reviewer_assigned', 'review_in_progress'] },
  { id: 'decision', label: 'Final Decision', statuses: ['accepted', 'rejected'] },
  { id: 'revision', label: 'Revision', statuses: ['revision_required', 'minor_revision_required', 'major_revision_required', 'resubmitted'] },
  { id: 'accepted', label: 'Accepted', statuses: ['accepted'] },
  { id: 'copy_editing', label: 'Copy Editing', statuses: ['copy_editing'] },
  { id: 'proofreading', label: 'Proofreading', statuses: ['proofreading'] },
  { id: 'ready', label: 'Ready for Publication', statuses: ['ready_for_publication'] },
  { id: 'published', label: 'Published', statuses: ['published'] },
];

const fileTypeLabels = {
  manuscript: 'Manuscript',
  supplementary: 'Supplementary File',
  plagiarism_report: 'Plagiarism Report',
  annotated_manuscript: 'Annotated Manuscript',
  reviewed_manuscript: 'Reviewed Manuscript',
  copy_edited_file: 'Copy-edited File',
  proof_file: 'Proof File',
  publication_pdf: 'Publication PDF',
};

function statusBadge(status) {
  const [label, tone = 'zinc'] = STATUS_META[status] || [String(status || 'Unknown').replaceAll('_', ' '), 'zinc'];
  return <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_TONE_CLASSES[tone] || STATUS_TONE_CLASSES.zinc}`}>{label}</span>;
}

function labelize(value) {
  return String(value || '').replaceAll('_', ' ');
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function fileDownloadUrl(path) {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  const apiBase = (api.defaults.baseURL || '').replace(/\/$/, '');
  const suffix = path.startsWith('/api/') ? path.replace(/^\/api/, '') : path;
  return `${apiBase}${suffix}`;
}

function Section({ title, icon: Icon, children, aside }) {
  return (
    <section className="rounded-xl border border-zinc-150 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900">
      <div className="mb-4 flex flex-col gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-850 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-amber-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-center text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">{children}</div>;
}

export default function ArticleWorkflowPage() {
  const params = useParams();
  const articleId = params?.id;
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);

  const isAuditViewer = hasRole('super_admin') || hasRole('admin') || hasRole('editor') || hasRole('magazine_editor') || hasRole('magazine-editor');
  const canPublish = (hasRole('super_admin') || hasRole('admin') || hasRole('publisher')) && PUBLISHABLE_STATUSES.has(article?.status);

  const loadWorkflow = async () => {
    if (!articleId || authLoading || !user) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/admin/articles/${articleId}/workflow`);
      const nextArticle = res.data?.article ? {
        ...res.data.article,
        files: res.data.files || res.data.article.files || [],
        versions: res.data.versions || res.data.article.versions || [],
      } : null;
      setArticle(nextArticle);
    } catch (err) {
      logError(err);
      setError(safeApiMessage(err, 'Unable to load this article workflow.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [articleId, user, authLoading]);

  const currentStepIndex = useMemo(() => {
    const index = workflowSteps.findIndex((step) => step.statuses.includes(article?.status));
    return index < 0 ? 0 : index;
  }, [article?.status]);

  const assignedNames = useMemo(() => {
    if (!article) return [];
    const names = [];
    (article.sub_editor_assignments || []).forEach((item) => names.push(`Sub Editor: ${item.sub_editor?.name || 'Assigned'}`));
    (article.reviewer_assignments || []).forEach((item) => names.push(`Reviewer: ${item.reviewer?.name || 'Assigned'}`));
    (article.production_assignments || []).forEach((item) => names.push(`${labelize(item.role)}: ${item.user?.name || 'Assigned'}`));
    return names;
  }, [article]);

  const handlePublishSubmit = async (publishData) => {
    const payload = new FormData();
    payload.append('published_year', publishData.published_year);
    payload.append('published_month', publishData.published_month);
    if (publishData.magazine_issue_id) payload.append('magazine_issue_id', publishData.magazine_issue_id);
    if (publishData.doi) payload.append('doi', publishData.doi);
    if (publishData.page_start) payload.append('page_start', publishData.page_start);
    if (publishData.page_end) payload.append('page_end', publishData.page_end);
    if (publishData.publication_pdf) payload.append('publication_pdf', publishData.publication_pdf);

    await api.post(`/admin/articles/${article.id}/publish`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    toast('Article published successfully.', 'success');
    setPublishOpen(false);
    await loadWorkflow();
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <h1 className="font-bold">Workflow unavailable</h1>
            <p className="mt-1 text-xs">{error || 'The article workflow could not be loaded.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <title>{article.title} Workflow - ScholarlyNest</title>
      <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 dark:border-zinc-850 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Link href="/admin/articles" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-amber-600">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Articles
          </Link>
          <h1 className="max-w-4xl text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(article.status)}
            <span className="rounded-lg border border-zinc-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800">Author view: {STATUS_LABELS[article.status] || labelize(article.status)}</span>
          </div>
        </div>
        {canPublish && (
          <button type="button" onClick={() => setPublishOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950">
            <Newspaper className="h-3.5 w-3.5" />
            Publish
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
        <div className="space-y-6">
          <Section title="Article Summary" icon={FileText}>
            <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div><dt className="font-bold uppercase tracking-wider text-zinc-400">Magazine</dt><dd className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">{article.magazine?.title || 'Not assigned'}</dd></div>
              <div><dt className="font-bold uppercase tracking-wider text-zinc-400">Article Type</dt><dd className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">{labelize(article.article_type || 'article')}</dd></div>
              <div><dt className="font-bold uppercase tracking-wider text-zinc-400">Submitted</dt><dd className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">{formatDate(article.created_at)}</dd></div>
              <div><dt className="font-bold uppercase tracking-wider text-zinc-400">Author</dt><dd className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">{article.user?.name || article.article_authors?.[0]?.name || 'Not recorded'}</dd></div>
            </dl>
            {assignedNames.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {assignedNames.map((name) => <span key={name} className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"><User className="h-3 w-3" />{name}</span>)}
              </div>
            )}
          </Section>

          <Section title="Workflow Progress" icon={ClipboardCheck}>
            <div className="space-y-2">
              {workflowSteps.map((step, index) => {
                const active = step.statuses.includes(article.status);
                const complete = index < currentStepIndex;
                return (
                  <div key={step.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${active ? 'border-amber-400/40 bg-amber-500/[0.05]' : complete ? 'border-emerald-500/10 bg-emerald-500/[0.04]' : 'border-zinc-150 bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-950'}`}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-amber-500 text-white' : complete ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800'}`}>{complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Publication" icon={BookOpen}>
            <dl className="grid grid-cols-1 gap-3 text-xs">
              <div><dt className="font-bold uppercase tracking-wider text-zinc-400">Issue</dt><dd className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">{article.issue ? `${article.issue.special_title || 'Issue'} ${article.issue.volume_number || ''}/${article.issue.issue_number || ''}` : 'Not assigned'}</dd></div>
              <div><dt className="font-bold uppercase tracking-wider text-zinc-400">DOI</dt><dd className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">{article.doi || 'Not recorded'}</dd></div>
              <div><dt className="font-bold uppercase tracking-wider text-zinc-400">Publication Date</dt><dd className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">{article.published_month || article.published_year ? `${article.published_month || ''} ${article.published_year || ''}`.trim() : 'Not published'}</dd></div>
              <div><dt className="font-bold uppercase tracking-wider text-zinc-400">Pages</dt><dd className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">{article.page_start || article.page_end ? `${article.page_start || '?'}-${article.page_end || '?'}` : 'Not recorded'}</dd></div>
            </dl>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Role Actions" icon={ClipboardCheck}>
            <WorkflowActionPanel
              article={article}
              workflowContext={article}
              user={user}
              hasRole={hasRole}
              hasPermission={hasPermission}
              onWorkflowChanged={loadWorkflow}
              onOpenPublish={() => setPublishOpen(true)}
              toast={toast}
            />
          </Section>

          <Section title="Files" icon={Download} aside={<span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{article.files?.length || 0} visible</span>}>
            {(article.files || []).length === 0 ? <EmptyState>No files are visible for your role.</EmptyState> : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {article.files.map((file) => (
                  <a key={file.id} href={fileDownloadUrl(file.download_url)} target="_blank" rel="noreferrer" className="rounded-xl border border-zinc-150 bg-zinc-50 p-3 hover:border-amber-400/40 dark:border-zinc-850 dark:bg-zinc-950">
                    <p className="truncate text-xs font-bold text-zinc-900 dark:text-white">{file.original_name}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">{fileTypeLabels[file.file_type] || labelize(file.file_type)} · {file.created_at ? formatDate(file.created_at) : ''}</p>
                  </a>
                ))}
              </div>
            )}
          </Section>

          <Section title="Review And Recommendations" icon={MessageSquare}>
            <div className="space-y-3">
              {(article.sub_editor_assignments || []).map((item) => (
                <div key={`sub-${item.id}`} className="rounded-xl border border-zinc-150 bg-zinc-50 p-3 text-xs dark:border-zinc-850 dark:bg-zinc-950">
                  <p className="font-bold text-zinc-900 dark:text-white">Sub Editor: {item.sub_editor?.name || 'Assigned'}</p>
                  <p className="mt-1 text-zinc-500">{item.recommendation ? `Recommendation: ${labelize(item.recommendation)}` : `Status: ${labelize(item.status)}`}</p>
                  {item.comments && <p className="mt-2 text-zinc-600 dark:text-zinc-350">{item.comments}</p>}
                </div>
              ))}
              {(article.reviewer_assignments || []).map((item) => (
                <div key={`rev-${item.id}`} className="rounded-xl border border-zinc-150 bg-zinc-50 p-3 text-xs dark:border-zinc-850 dark:bg-zinc-950">
                  <p className="font-bold text-zinc-900 dark:text-white">Reviewer: {item.reviewer?.name || 'Assigned reviewer'}</p>
                  <p className="mt-1 text-zinc-500">{item.recommendation ? `Recommendation: ${labelize(item.recommendation)}` : `Status: ${labelize(item.status)}`}</p>
                  {item.comments_for_author && <p className="mt-2 text-zinc-600 dark:text-zinc-350">{item.comments_for_author}</p>}
                </div>
              ))}
              {(article.editorial_decisions || []).map((item) => (
                <div key={`decision-${item.id}`} className="rounded-xl border border-zinc-150 bg-zinc-50 p-3 text-xs dark:border-zinc-850 dark:bg-zinc-950">
                  <p className="font-bold text-zinc-900 dark:text-white">Final Decision: {labelize(item.decision)}</p>
                  {item.comments_for_author && <p className="mt-2 text-zinc-600 dark:text-zinc-350">{item.comments_for_author}</p>}
                  {item.internal_notes && <p className="mt-2 text-zinc-500">Internal: {item.internal_notes}</p>}
                </div>
              ))}
              {(article.sub_editor_assignments || []).length + (article.reviewer_assignments || []).length + (article.editorial_decisions || []).length === 0 && <EmptyState>No recommendations are visible yet.</EmptyState>}
            </div>
          </Section>

          <Section title="Version History" icon={History}>
            {(article.versions || []).length === 0 ? <EmptyState>No version snapshots have been recorded yet.</EmptyState> : (
              <div className="space-y-3">
                {article.versions.map((version) => (
                  <div key={version.id} className="rounded-xl border border-zinc-150 bg-zinc-50 p-3 text-xs dark:border-zinc-850 dark:bg-zinc-950">
                    <p className="font-bold text-zinc-900 dark:text-white">Version {version.version_number} · {version.label || 'Snapshot'}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">{labelize(version.status_snapshot)} · {version.creator?.name || 'Unknown'} · {formatDate(version.created_at)}</p>
                    {version.change_summary && <p className="mt-2 text-zinc-600 dark:text-zinc-350">Summary: {version.change_summary}</p>}
                    {version.author_response && <p className="mt-1 text-zinc-600 dark:text-zinc-350">Response: {version.author_response}</p>}
                    {(version.files || []).length > 0 && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">{version.files.length} linked file(s)</p>}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {isAuditViewer && (
            <Section title="Audit Trail" icon={ShieldAlert}>
              {(article.audit_logs || []).length === 0 ? <EmptyState>No audit events are visible for this article.</EmptyState> : (
                <div className="space-y-2">
                  {(article.audit_logs || []).slice(0, 20).map((item) => (
                    <div key={item.id} className="rounded-xl border border-zinc-150 bg-zinc-50 p-3 text-xs dark:border-zinc-850 dark:bg-zinc-950">
                      <p className="font-bold text-zinc-900 dark:text-white">{labelize(item.action)}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-450">{item.actor?.name || 'System'} · {formatDate(item.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}
        </div>
      </div>

      <PublishArticleModal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        article={article}
        onSubmit={handlePublishSubmit}
      />
    </div>
  );
}
