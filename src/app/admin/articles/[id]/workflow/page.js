'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import api from '../../../../../utils/api';
import { safeApiMessage } from '../../../../../utils/safeErrors';
import { logError } from '../../../../../utils/safeLogger';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import LoadingState from '../../../../../components/ui/LoadingState';
import ErrorState from '../../../../../components/ui/ErrorState';
import Alert from '../../../../../components/ui/Alert';
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
import { uploadAndAwaitClean } from '../../../../../lib/mediaUploads/DirectUploadClient';

export default function ArticleWorkflowPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = params?.id;
  const { user, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const observerReadonly = searchParams.get('observer_readonly') === '1';

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
    [
      'article_type',
      'article_category',
      'open_access_label',
      'academic_editor',
      'received_at',
      'accepted_at',
      'published_at',
      'license_statement',
      'data_availability_statement',
      'funding_statement',
      'competing_interests_statement',
      'abbreviations',
      'citation_text',
    ].forEach((key) => {
      if (publishData[key] !== undefined && publishData[key] !== null && String(publishData[key]).trim() !== '') {
        payload.append(key, publishData[key]);
      }
    });
    if (publishData.is_peer_reviewed !== undefined) {
      payload.append('is_peer_reviewed', publishData.is_peer_reviewed ? '1' : '0');
    }
    if (publishData.publication_sections) {
      const publicationSections = [];
      for (const section of publishData.publication_sections) {
        let mediaUploadId = section.existing_media_upload_session_id || null;
        if (section.image_file) {
          const sectionImageUpload = await uploadAndAwaitClean({
            file: section.image_file,
            purpose: 'publication_section_image',
            attachableId: article.id,
          });
          mediaUploadId = sectionImageUpload.id;
        }
        publicationSections.push({
          section_key: section.section_key,
          title: section.title,
          content_html: section.content_html,
          sort_order: section.sort_order,
          media_upload_session_id: mediaUploadId,
        });
      }
      payload.append('publication_sections', JSON.stringify(publicationSections));
    }
    if (publishData.publication_pdf) {
      const pdfUpload = await uploadAndAwaitClean({
        file: publishData.publication_pdf,
        purpose: 'article_published_pdf',
        attachableId: article.id,
      });
      payload.append('publication_pdf_upload_id', pdfUpload.id);
    }

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
        canPublish={canPublish && !observerReadonly}
        onPublish={() => setPublishOpen(true)}
      />

      {observerReadonly ? (
        <Alert tone="info" title="Super Admin Review Mode">
          This manuscript record was opened from an observer queue. Workflow actions are disabled in this view.
        </Alert>
      ) : (
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
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <ArticleMetadataPanel article={article} />
          <ReviewRecommendationPanel article={article} canSeeReviewerIdentity={showReviewerIdentity} />
        </div>
        <aside className="space-y-6">
          <WorkflowContextPanel article={article} />
          <AssignmentSummary article={article} canSeeReviewerIdentity={showReviewerIdentity} />
          <ArticleFilesPanel files={article.files || []} assets={article.assets || []} />
        </aside>
      </div>

      <WorkflowTimeline article={article} />

      {!observerReadonly && (
        <PublishArticleModal
          isOpen={publishOpen}
          onClose={() => setPublishOpen(false)}
          articleTitle={article.title}
          magazineId={article.magazine_id}
          publicationSections={article.publication_sections || []}
          onSubmit={handlePublishSubmit}
        />
      )}
    </main>
  );
}
