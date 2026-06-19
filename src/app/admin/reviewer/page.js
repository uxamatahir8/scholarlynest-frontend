'use client';

import AssignmentTaskDashboard from '../../../components/admin/AssignmentTaskDashboard';

export default function ReviewerDashboardPage() {
  return (
    <AssignmentTaskDashboard
      kind="reviewer"
      title="Reviewer Desk"
      description="Manage review invitations, pending reviews, completed history, manuscript files, and scorecard submissions."
      endpoint="/admin/my-reviewer-assignments"
    />
  );
}
