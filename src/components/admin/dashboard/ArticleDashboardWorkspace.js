'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Inbox } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import LoadingState from '../../ui/LoadingState';
import ErrorState from '../../ui/ErrorState';
import DashboardWorkspace from './DashboardWorkspace';
import DashboardSummary from './DashboardSummary';
import DashboardQueue from './DashboardQueue';
import DashboardSection from './DashboardSection';
import DashboardQuickLinks from './DashboardQuickLinks';
import { articleQueueItem } from './dashboardUtils';

async function fetchArticleQueue(queue) {
  const params = { per_page: queue.limit || 5 };
  if (queue.status) params.status = queue.status;
  const response = await api.get('/admin/articles', { params });
  const data = response.data?.data || [];
  return {
    ...queue,
    total: response.data?.total ?? data.length,
    items: data.map((article) => articleQueueItem(article, queue.itemActionLabel)),
  };
}

export default function ArticleDashboardWorkspace({ title, description, action, queues, quickLinks }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queueData, setQueueData] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const results = await Promise.all(queues.map(fetchArticleQueue));
        if (active) setQueueData(results);
      } catch (err) {
        logError('Failed to load role dashboard article queues:', err);
        if (active) setError(safeApiMessage(err, 'Unable to load your workspace.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [queues]);

  const summaryItems = useMemo(() => queueData.map((queue) => ({
    label: queue.summaryLabel || queue.title,
    value: queue.total,
    icon: queue.icon,
  })), [queueData]);

  return (
    <DashboardWorkspace title={title} description={description} action={action}>
      {loading ? (
        <LoadingState label="Loading workspace..." className="min-h-[320px]" />
      ) : error ? (
        <ErrorState title="Workspace could not be loaded">{error}</ErrorState>
      ) : (
        <>
          <DashboardSummary items={summaryItems} />
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <div className="space-y-8">
              {queueData.map((queue) => (
                <DashboardQueue
                  key={queue.key}
                  title={queue.title}
                  description={queue.description}
                  items={queue.items}
                  emptyTitle={queue.emptyTitle}
                  emptyDescription={queue.emptyDescription}
                  actionHref={queue.actionHref}
                  actionLabel={queue.actionLabel}
                />
              ))}
            </div>
            <DashboardSection title="Useful Links" description="Open the full tools for this workspace.">
              <DashboardQuickLinks links={quickLinks} />
            </DashboardSection>
          </div>
        </>
      )}
    </DashboardWorkspace>
  );
}

export const dashboardIcons = {
  submitted: AlertCircle,
  active: Inbox,
  complete: CheckCircle2,
  article: FileText,
};
