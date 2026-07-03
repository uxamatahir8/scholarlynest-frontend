'use client';

import AssignmentDashboardWorkspace from '../../../components/admin/dashboard/AssignmentDashboardWorkspace';

export default function ProofreaderDashboardPage() {
  return (
    <AssignmentDashboardWorkspace
      title="Proofreader Desk"
      description="Review assigned proofing work, permitted files, corrections, and completion handoff."
      endpoint="/admin/my-production-assignments?role=proofreader"
      primaryHref="/admin/proofreader"
      primaryLabel="Open Proofing Tasks"
      activeTitle="Assigned Proofing Tasks"
      activeDescription="Proofing assignments waiting for review or completion."
      emptyActive="No proofing task is assigned right now."
      emptyCompleted="Completed proofing tasks will appear here."
    />
  );
}
