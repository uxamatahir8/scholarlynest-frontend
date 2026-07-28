'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import LoadingState from '../../ui/LoadingState';
import ErrorState from '../../ui/ErrorState';
import { Button } from '../../ui/Button';
import ScopedWorkflowActionPanel from '../ScopedWorkflowActionPanel';
import { withVersionReviewerData } from './workspaceManifest.mjs';

export default function ReviewersPanel({ article, version, versionTab, user, hasRole, hasPermission, observerReadonly, onWorkflowChanged, toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await api.get(`/admin/articles/${article.id}/versions/${version.id}/reviewers`, {
        params: { review_round: versionTab.review_round || 1 },
      });
      setData(response.data?.data || null);
    } catch (requestError) {
      logError(requestError);
      setError({
        status: requestError?.response?.status,
        message: safeApiMessage(requestError, 'Unable to load reviewers for this version.'),
      });
    } finally {
      setLoading(false);
    }
  }, [article.id, version.id, versionTab.review_round, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const reviewerArticle = useMemo(() => withVersionReviewerData(article, data), [article, data]);
  const handleChanged = async () => {
    await onWorkflowChanged?.();
    setRefreshKey((value) => value + 1);
  };

  if (loading) return <LoadingState label="Loading reviewers for this version..." className="min-h-64" />;
  if (error) {
    const title = error.status === 403 ? 'Reviewer access unavailable' : error.status === 409 ? 'Reviewer workflow conflict' : 'Reviewers unavailable';
    return <ErrorState title={title}><p>{error.message}</p><Button type="button" variant="secondary" className="mt-3" onClick={load}>Retry</Button></ErrorState>;
  }

  return <ScopedWorkflowActionPanel
    article={reviewerArticle}
    workflowContext={reviewerArticle}
    user={user}
    hasRole={hasRole}
    hasPermission={hasPermission}
    onWorkflowChanged={handleChanged}
    toast={toast}
    actionScope="reviewers"
    reviewerCanManage={!observerReadonly && Boolean(data?.capabilities?.manage)}
  />;
}
