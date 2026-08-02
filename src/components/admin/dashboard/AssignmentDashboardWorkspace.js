'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Inbox } from 'lucide-react';
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
import { assignmentQueueItem, completedAssignmentStatuses } from './dashboardUtils';

const EMPTY_OBSERVER_PARAMS = {};

export default function AssignmentDashboardWorkspace({
  title,
  description,
  endpoint,
  primaryHref,
  primaryLabel,
  fullDeskLabel,
  activeTitle,
  activeDescription,
  completedTitle = 'Completed Work',
  completedDescription = 'Recently completed assignments from this queue.',
  emptyActive,
  emptyCompleted,
  quickLinks = [],
  observerMode = false,
  observerUser = null,
  observerParams = EMPTY_OBSERVER_PARAMS,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const isReviewerDashboard = endpoint.includes('/admin/my-reviewer-assignments');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const sep = endpoint.includes('?') ? '&' : '?';
        const response = await api.get(`${endpoint}${sep}page=1&per_page=10`, { params: observerParams });
        if (active) setAssignments(response.data?.data || []);
      } catch (err) {
        logError('Failed to load assignment workspace:', err);
        if (active) setError(safeApiMessage(err, 'Unable to load your assigned work.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [endpoint, observerParams]);

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => !completedAssignmentStatuses.has(assignment.status)),
    [assignments],
  );
  const completedAssignments = useMemo(
    () => assignments.filter((assignment) => completedAssignmentStatuses.has(assignment.status)),
    [assignments],
  );

  const withObservedAssignee = (item) => ({
    ...item,
    assigneeName: item.assigneeName || observerUser?.name,
  });
  const activeItems = activeAssignments.map((assignment) => withObservedAssignee(assignmentQueueItem(assignment, 'Open Workflow')));
  const completedItems = completedAssignments.map((assignment) => withObservedAssignee(assignmentQueueItem(assignment, 'Review Record')));

  return (
    <DashboardWorkspace
      title={title}
      description={description}
      action={observerMode ? null : {
        eyebrow: 'Next step',
        title: primaryLabel,
        description: activeItems.length > 0 ? 'Open your full desk to continue the next assigned task.' : 'Your desk is ready when new assignments arrive.',
        href: primaryHref,
        label: primaryLabel,
      }}
    >
      {loading ? (
        <LoadingState label="Loading assigned work..." className="min-h-[320px]" />
      ) : error ? (
        <ErrorState title="Assigned work could not be loaded">{error}</ErrorState>
      ) : (
        <div className="space-y-8">
          <DashboardSummary
            items={[
              { label: 'Active', value: activeAssignments.length, icon: Inbox },
              { label: 'Completed', value: completedAssignments.length, icon: CheckCircle2 },
              { label: 'Total Assigned', value: assignments.length, icon: ClipboardCheck },
            ]}
          />
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <div className="space-y-8">
              <DashboardQueue
                title={activeTitle}
                description={activeDescription}
                items={activeItems}
                emptyTitle="No active assignments"
                emptyDescription={observerMode && observerUser ? `No active assignments are visible for ${observerUser.name}.` : emptyActive}
                actionHref={observerMode ? null : primaryHref}
                actionLabel={observerMode ? null : (fullDeskLabel || 'Open Full Desk')}
                priority={isReviewerDashboard}
              />
              <DashboardQueue
                title={completedTitle}
                description={completedDescription}
                items={completedItems}
                emptyTitle="No completed work yet"
                emptyDescription={observerMode && observerUser ? `No completed assignments are visible for ${observerUser.name}.` : emptyCompleted}
                actionHref={observerMode ? null : primaryHref}
                actionLabel={observerMode ? null : (fullDeskLabel || 'Open Full Desk')}
              />
            </div>
            {!observerMode && (
            <DashboardSection title="Desk Links" description="Continue in the full task workspace when needed.">
              <DashboardQuickLinks links={[
                { label: fullDeskLabel || 'Open Full Desk', href: primaryHref, icon: ClipboardCheck, description: 'View all assignments and workflow actions.' },
                ...quickLinks,
              ]} />
            </DashboardSection>
            )}
          </div>
        </div>
      )}
    </DashboardWorkspace>
  );
}
