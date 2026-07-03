'use client';

import React, { useMemo } from 'react';
import { BookOpen, ClipboardCheck, FileText, Settings, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPrimaryRole, hasRole as userHasRole, normalizeRoleName } from '../../utils/roles';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import ArticleDashboardWorkspace, { dashboardIcons } from '../../components/admin/dashboard/ArticleDashboardWorkspace';
import AssignmentDashboardWorkspace from '../../components/admin/dashboard/AssignmentDashboardWorkspace';
import PublisherDashboardWorkspace from '../../components/admin/dashboard/PublisherDashboardWorkspace';
import { validAdminLinks } from '../../components/admin/dashboard/dashboardUtils';

const superAdminQueues = [
  {
    key: 'submitted',
    title: 'Articles Requiring Attention',
    description: 'Submitted manuscripts waiting for editorial screening.',
    status: 'submitted',
    icon: dashboardIcons.submitted,
    emptyTitle: 'No submitted manuscripts waiting',
    emptyDescription: 'New submissions will appear here when authors send manuscripts for review.',
    actionHref: '/admin/articles?status=submitted',
    actionLabel: 'Open Article Queue',
    itemActionLabel: 'Open Workflow',
  },
  {
    key: 'under-review',
    title: 'Active Review Work',
    description: 'Manuscripts currently moving through review and editorial follow-up.',
    status: 'under_review',
    icon: dashboardIcons.active,
    emptyTitle: 'No active review work',
    emptyDescription: 'Manuscripts under review will appear here.',
    actionHref: '/admin/articles?status=under_review',
    actionLabel: 'Open Review Queue',
    itemActionLabel: 'Open Workflow',
  },
  {
    key: 'revision',
    title: 'Revision Follow-up',
    description: 'Manuscripts waiting on author revision or resubmission review.',
    status: 'revision_required',
    icon: dashboardIcons.article,
    emptyTitle: 'No revision follow-up',
    emptyDescription: 'Revision requests and resubmissions will appear here when action is needed.',
    actionHref: '/admin/articles?status=revision_required',
    actionLabel: 'Open Revisions',
    itemActionLabel: 'Open Workflow',
  },
];

const adminQueues = [
  {
    key: 'submitted',
    title: 'Administrative Article Queue',
    description: 'Manuscripts visible to your role that need review or routing.',
    status: 'submitted',
    icon: dashboardIcons.submitted,
    emptyTitle: 'No submitted manuscripts waiting',
    emptyDescription: 'Submitted manuscripts will appear here when they are visible to your role.',
    actionHref: '/admin/articles?status=submitted',
    actionLabel: 'Open Article Queue',
    itemActionLabel: 'Open Workflow',
  },
  {
    key: 'active',
    title: 'Active Manuscripts',
    description: 'Work currently moving through editorial or publishing steps.',
    status: 'under_review',
    icon: dashboardIcons.active,
    emptyTitle: 'No active manuscripts',
    emptyDescription: 'Active manuscripts will appear here when available.',
    actionHref: '/admin/articles?status=under_review',
    actionLabel: 'Open Active Work',
    itemActionLabel: 'Open Workflow',
  },
];

const editorialQueues = [
  {
    key: 'submitted',
    title: 'Awaiting Editorial Screening',
    description: 'New submissions assigned to magazines you can manage.',
    status: 'submitted',
    icon: dashboardIcons.submitted,
    emptyTitle: 'No manuscripts awaiting screening',
    emptyDescription: 'New submitted manuscripts will appear here.',
    actionHref: '/admin/articles?status=submitted',
    actionLabel: 'Review Editorial Queue',
    itemActionLabel: 'Review',
  },
  {
    key: 'review',
    title: 'Review in Progress',
    description: 'Manuscripts currently in review or awaiting editorial follow-up.',
    status: 'under_review',
    icon: dashboardIcons.active,
    emptyTitle: 'No review work in progress',
    emptyDescription: 'Reviewer-assigned manuscripts will appear here.',
    actionHref: '/admin/articles?status=under_review',
    actionLabel: 'Open Review Work',
    itemActionLabel: 'Open Workflow',
  },
  {
    key: 'revision',
    title: 'Revision Follow-up',
    description: 'Manuscripts requiring author revision or resubmission handling.',
    status: 'revision_required',
    icon: dashboardIcons.article,
    emptyTitle: 'No revision requests',
    emptyDescription: 'Revision-required manuscripts will appear here when available.',
    actionHref: '/admin/articles?status=revision_required',
    actionLabel: 'Open Revisions',
    itemActionLabel: 'Open Workflow',
  },
];

const authorQueues = [
  {
    key: 'drafts',
    title: 'Draft Manuscripts',
    description: 'Manuscripts you have started but not submitted.',
    status: 'draft',
    icon: dashboardIcons.article,
    emptyTitle: 'No drafts yet',
    emptyDescription: 'Start a new submission when you are ready to prepare a manuscript.',
    actionHref: '/admin/articles',
    actionLabel: 'View My Articles',
    itemActionLabel: 'Continue Draft',
  },
  {
    key: 'submitted',
    title: 'Submitted Manuscripts',
    description: 'Your manuscripts currently waiting in the review process.',
    status: 'submitted',
    icon: dashboardIcons.submitted,
    emptyTitle: 'No submitted manuscripts',
    emptyDescription: 'Submitted manuscripts will appear here after you send them for review.',
    actionHref: '/admin/articles?status=submitted',
    actionLabel: 'View Submitted',
    itemActionLabel: 'View Status',
  },
  {
    key: 'revision',
    title: 'Revision Requests',
    description: 'Manuscripts that need an author revision response.',
    status: 'revision_required',
    icon: dashboardIcons.active,
    emptyTitle: 'No revision requests',
    emptyDescription: 'Revision requests will appear here when editors need changes from you.',
    actionHref: '/admin/articles?status=revision_required',
    actionLabel: 'View Revisions',
    itemActionLabel: 'Open Revision',
  },
  {
    key: 'published',
    title: 'Recently Published',
    description: 'Your manuscripts that have reached publication.',
    status: 'published',
    icon: dashboardIcons.complete,
    emptyTitle: 'No published manuscripts yet',
    emptyDescription: 'Published manuscripts will appear here after completion.',
    actionHref: '/admin/articles?status=published',
    actionLabel: 'View Published',
    itemActionLabel: 'View Record',
  },
];

function primaryRoleForUser(user, hasRole) {
  const primary = normalizeRoleName(getPrimaryRole(user));
  if (primary) return primary;
  if (hasRole?.('magazine_editor') || userHasRole(user, 'magazine_editor')) return 'magazine_editor';
  return 'author';
}

export default function AdminOverview() {
  const { user, loading, hasRole, impersonationStatus } = useAuth();

  const role = useMemo(() => primaryRoleForUser(user, hasRole), [user, hasRole]);

  if (loading) return <LoadingState label="Loading workspace..." className="min-h-[420px]" />;
  if (!user) return <ErrorState title="Session required">Please sign in to view your workspace.</ErrorState>;

  if (role === 'super_admin' && !impersonationStatus?.active) {
    return (
      <ArticleDashboardWorkspace
        title="Super Admin Workspace"
        description="Review operational publishing work, article queues, and valid management areas."
        action={{
          eyebrow: 'Next step',
          title: 'Review submitted manuscripts',
          description: 'Start with manuscript records waiting for editorial screening or routing.',
          href: '/admin/articles?status=submitted',
          label: 'Open Article Queue',
        }}
        queues={superAdminQueues}
        quickLinks={validAdminLinks({ includeUsers: true })}
      />
    );
  }

  if (role === 'admin') {
    return (
      <ArticleDashboardWorkspace
        title="Admin Workspace"
        description="Work through permitted publishing, content, and article operations."
        action={{
          eyebrow: 'Next step',
          title: 'Review administrative article work',
          description: 'Open the manuscript queue available to your current permissions.',
          href: '/admin/articles',
          label: 'Open Articles',
        }}
        queues={adminQueues}
        quickLinks={validAdminLinks({ includeUsers: false })}
      />
    );
  }

  if (role === 'editor' || role === 'magazine_editor') {
    return (
      <ArticleDashboardWorkspace
        title="Editorial Workspace"
        description="Focus on manuscripts that need editorial screening, review routing, and decision follow-up."
        action={{
          eyebrow: 'Next step',
          title: 'Review editorial queue',
          description: 'Start with submitted manuscripts visible to your assigned magazine scope.',
          href: '/admin/articles?status=submitted',
          label: 'Review Queue',
        }}
        queues={editorialQueues}
        quickLinks={[
          { label: 'Article Queue', href: '/admin/articles', icon: FileText, description: 'Open the full editorial article list.' },
          { label: 'My Sub Editors', href: '/admin/editor/sub-editors', icon: Users, description: 'Manage assigned sub-editor relationships.' },
          { label: 'Magazines', href: '/admin/magazines', icon: BookOpen, description: 'Review assigned magazine records.' },
        ]}
      />
    );
  }

  if (role === 'publisher') return <PublisherDashboardWorkspace />;

  if (role === 'sub_editor') {
    return (
      <AssignmentDashboardWorkspace
        title="Sub Editor Workspace"
        description="Review assigned manuscripts and prepare recommendations for editors."
        endpoint="/admin/my-sub-editor-assignments"
        primaryHref="/admin/sub-editor"
        primaryLabel="Open Sub Editor Desk"
        activeTitle="Assigned Articles"
        activeDescription="Manuscripts waiting for your recommendation or follow-up."
        emptyActive="No assigned manuscript is waiting for your recommendation right now."
        emptyCompleted="Completed recommendations will appear here after submission."
      />
    );
  }

  if (role === 'reviewer') {
    return (
      <AssignmentDashboardWorkspace
        title="Reviewer Workspace"
        description="Review invitations, accepted reviews, and completed review work assigned to you."
        endpoint="/admin/my-reviewer-assignments"
        primaryHref="/admin/reviewer"
        primaryLabel="Open Reviewer Desk"
        activeTitle="Pending and Active Reviews"
        activeDescription="Review invitations and accepted reviews that need your attention."
        completedTitle="Completed Reviews"
        completedDescription="Reviews you have already submitted."
        emptyActive="No review invitation or active review is waiting right now."
        emptyCompleted="Completed reviews will appear here after submission."
      />
    );
  }

  if (role === 'copy_editor') {
    return (
      <AssignmentDashboardWorkspace
        title="Copy Editor Workspace"
        description="Work through assigned copyediting tasks and production handoff."
        endpoint="/admin/my-production-assignments?role=copy_editor"
        primaryHref="/admin/copy-editor"
        primaryLabel="Open Copy Editor Desk"
        activeTitle="Assigned Copyediting Tasks"
        activeDescription="Production assignments waiting for copyediting action."
        emptyActive="No copyediting task is assigned right now."
        emptyCompleted="Completed copyediting tasks will appear here."
      />
    );
  }

  if (role === 'proofreader') {
    return (
      <AssignmentDashboardWorkspace
        title="Proofreader Workspace"
        description="Review assigned proofing tasks and mark proof work complete."
        endpoint="/admin/my-production-assignments?role=proofreader"
        primaryHref="/admin/proofreader"
        primaryLabel="Open Proofreader Desk"
        activeTitle="Assigned Proofing Tasks"
        activeDescription="Proofing assignments waiting for review or completion."
        emptyActive="No proofing task is assigned right now."
        emptyCompleted="Completed proofing tasks will appear here."
      />
    );
  }

  return (
    <ArticleDashboardWorkspace
      title="Author Workspace"
      description="Track your own manuscripts and continue submission work."
      action={{
        eyebrow: 'Next step',
        title: 'Start a new manuscript submission',
        description: 'Create a manuscript record and prepare it for editorial review.',
        href: '/admin/articles/new',
        label: 'New Submission',
      }}
      queues={authorQueues}
      quickLinks={[
        { label: 'My Articles', href: '/admin/articles', icon: FileText, description: 'Review all manuscript records visible to you.' },
        { label: 'New Submission', href: '/admin/articles/new', icon: ClipboardCheck, description: 'Start a manuscript submission.' },
        { label: 'My Account', href: '/admin/settings', icon: Settings, description: 'Manage profile and security settings.' },
      ]}
    />
  );
}
