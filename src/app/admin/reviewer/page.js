'use client';

import AssignmentDashboardWorkspace from '../../../components/admin/dashboard/AssignmentDashboardWorkspace';

export default function ReviewerDashboardPage() {
  return (
    <AssignmentDashboardWorkspace
      title="Reviewer Desk"
      description="Manage review invitations, active reviews, due dates, and completed review work."
      endpoint="/admin/my-reviewer-assignments"
      primaryHref="/admin/reviewer"
      primaryLabel="Open Pending Reviews"
      activeTitle="Pending and Active Reviews"
      activeDescription="Review invitations and accepted reviews assigned to you."
      completedTitle="Completed Reviews"
      completedDescription="Reviews you have already submitted."
      emptyActive="No review invitation or active review is waiting right now."
      emptyCompleted="Completed reviews will appear here after submission."
    />
  );
}
