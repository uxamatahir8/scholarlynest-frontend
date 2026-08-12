'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, CloudUpload, FileCheck2, Newspaper } from 'lucide-react';
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
import { publicationQueueItem } from './dashboardUtils';

const EMPTY_OBSERVER_PARAMS = {};

export default function PublisherDashboardWorkspace({
  standalone = false,
  observerMode = false,
  observerUser = null,
  observerParams = EMPTY_OBSERVER_PARAMS,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState({ magazines: [], ready_articles: [], published_articles: [], issues: [], counts: {} });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/admin/publisher-dashboard', { params: observerParams });
        if (active) {
          setDashboard({
            magazines: response.data?.magazines || [],
            ready_articles: response.data?.ready_articles || [],
            published_articles: response.data?.published_articles || [],
            issues: response.data?.issues || [],
            counts: response.data?.counts || {},
          });
        }
      } catch (err) {
        logError('Failed to load publisher workspace:', err);
        if (active) setError(safeApiMessage(err, 'Unable to load publisher workspace.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [observerParams]);

  const readyItems = useMemo(
    () => dashboard.ready_articles.map((article) => publicationQueueItem(article, 'Prepare Publication')),
    [dashboard.ready_articles],
  );
  const publishedItems = useMemo(
    () => dashboard.published_articles.map((article) => publicationQueueItem(article, 'View Workflow')),
    [dashboard.published_articles],
  );
  const issueLinks = dashboard.issues.slice(0, 6).map((issue) => ({
    label: issue.special_title || `Vol. ${issue.volume_number || '-'}, Issue ${issue.issue_number || '-'}`,
    href: '/admin/issues',
    icon: Newspaper,
    description: `${issue.magazine?.title || 'Magazine'} · ${issue.articles_count || 0} article(s)`,
  }));

  return (
    <DashboardWorkspace
      title={standalone ? 'Publisher Desk' : 'Publisher Workspace'}
      description="Review publication-ready manuscripts, issue work, and recently published records."
      action={observerMode ? null : {
        eyebrow: 'Next step',
        title: 'Review publication-ready manuscripts',
        description: readyItems.length > 0 ? 'Start with manuscripts that can move into publication metadata and issue placement.' : 'No manuscript is currently waiting for publication.',
        href: '/admin/publisher',
        label: 'Open Publisher Desk',
      }}
    >
      {loading ? (
        <LoadingState label="Loading publisher workspace..." className="min-h-[320px]" />
      ) : error ? (
        <ErrorState title="Publisher workspace could not be loaded">{error}</ErrorState>
      ) : (
        <div className="space-y-8">
          <DashboardSummary
            items={[
              { label: 'Assigned Magazines', value: dashboard.counts.magazines, icon: BookOpen },
              { label: 'Ready Articles', value: dashboard.counts.ready_articles, icon: FileCheck2 },
              { label: 'Published', value: dashboard.counts.published_articles, icon: CheckCircle2 },
              { label: 'Issues', value: dashboard.counts.issues, icon: Newspaper },
            ]}
          />
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <div className="space-y-8">
              <DashboardQueue
                title="Ready for Publication"
                description="Accepted manuscripts that can be prepared for issue placement and publication."
                items={readyItems}
                emptyTitle="No articles ready for publication"
                emptyDescription={observerMode && observerUser ? `No publication-ready manuscripts are visible for ${observerUser.name}.` : 'Accepted manuscripts will appear here when they are ready for publisher action.'}
                actionHref={observerMode ? null : '/admin/publisher'}
                actionLabel={observerMode ? null : 'Open Publisher Desk'}
              />
              <DashboardQueue
                title="Recently Published"
                description="Recent publication records available to your role."
                items={publishedItems}
                emptyTitle="No published records yet"
                emptyDescription={observerMode && observerUser ? `No published records are visible for ${observerUser.name}.` : 'Published articles will appear here after publication.'}
                actionHref={observerMode ? null : '/admin/publisher'}
                actionLabel={observerMode ? null : 'Open Publisher Desk'}
              />
            </div>
            {!observerMode && (
            <DashboardSection title="Issue Work" description="Open issue management or review recent issue records.">
              <DashboardQuickLinks links={[
                { label: 'Direct Publications', href: '/admin/direct-publications', icon: CloudUpload, description: 'Create, validate, schedule, and publish privileged direct articles.' },
                { label: 'Issue Manager', href: '/admin/issues', icon: Newspaper, description: 'Create, update, publish, and unpublish issues.' },
                ...issueLinks,
              ]} />
            </DashboardSection>
            )}
          </div>
        </div>
      )}
    </DashboardWorkspace>
  );
}
