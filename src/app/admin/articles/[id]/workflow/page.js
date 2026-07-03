'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../../../utils/api';
import { safeApiMessage } from '../../../../../utils/safeErrors';
import { logError } from '../../../../../utils/safeLogger';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import LoadingState from '../../../../../components/ui/LoadingState';
import ErrorState from '../../../../../components/ui/ErrorState';
import WorkflowActionPanel from '../../../../../components/admin/WorkflowActionPanel';
import PublishArticleModal from '../../../../../components/admin/PublishArticleModal';
import { PUBLISHABLE_STATUSES } from '../../../../../components/admin/articleWorkflow';
import ManuscriptHeader from '../../../../../components/admin/workflow/ManuscriptHeader';
import WorkflowContextPanel from '../../../../../components/admin/workflow/WorkflowContextPanel';
import ArticleMetadataPanel from '../../../../../components/admin/workflow/ArticleMetadataPanel';
import AssignmentSummary from '../../../../../components/admin/workflow/AssignmentSummary';
import ArticleFilesPanel from '../../../../../components/admin/workflow/ArticleFilesPanel';
import ReviewRecommendationPanel from '../../../../../components/admin/workflow/ReviewRecommendationPanel';
import WorkflowTimeline from '../../../../../components/admin/workflow/WorkflowTimeline';
import { canViewReviewerIdentity } from '../../../../../components/admin/workflow/workflowDisplay';

export default function ArticleWorkflowPage() {
  const params = useParams();
  const articleId = params?.id;
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);

  const loadWorkflow = async () => {
    if (!articleId || authLoading || !user) return;
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/admin/articles/${articleId}/workflow`);
      const nextArticle = response.data?.article ? {
        ...response.data.article,
        files: response.data.files || response.data.article.files || [],
        versions: response.data.versions || response.data.article.versions || [],
      } : null;
      setArticle(nextArticle);
    } catch (err) {
      logError(err);
      setError(safeApiMessage(err, 'Unable to load this manuscript workflow.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [articleId, user, authLoading]);

  const canPublish = useMemo(() => (
    Boolean(article)
      && (hasRole('super_admin') || hasRole('admin') || hasRole('publisher'))
      && PUBLISHABLE_STATUSES.has(article.status)
  ), [article, hasRole]);

  const showReviewerIdentity = useMemo(() => canViewReviewerIdentity(user, hasRole), [user, hasRole]);

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
    toast('Manuscript published successfully.', 'success');
    setPublishOpen(false);
    await loadWorkflow();
  };

  if (authLoading || loading) {
    return <LoadingState label="Loading manuscript workflow..." className="min-h-[420px]" />;
  }

  if (error || !article) {
    return <ErrorState title="Workflow unavailable">{error || 'The manuscript workflow could not be loaded.'}</ErrorState>;
  }

  return (
    <main className="space-y-6">
      <title>{article.title} Workflow - ScholarlyNest</title>
      <ManuscriptHeader
        article={article}
        user={user}
        hasRole={hasRole}
        canPublish={canPublish}
        onPublish={() => setPublishOpen(true)}
      />

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <ArticleMetadataPanel article={article} />
          <ReviewRecommendationPanel article={article} canSeeReviewerIdentity={showReviewerIdentity} />
        </div>
        <aside className="space-y-6">
          <WorkflowContextPanel article={article} />
          <AssignmentSummary article={article} canSeeReviewerIdentity={showReviewerIdentity} />
          <ArticleFilesPanel files={article.files || []} />
        </aside>
      </div>

      <WorkflowTimeline article={article} />

      <PublishArticleModal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        articleTitle={article.title}
        magazineId={article.magazine_id}
        onSubmit={handlePublishSubmit}
      />
    </main>
  );
}
