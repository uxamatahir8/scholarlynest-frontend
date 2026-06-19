'use client';

import AssignmentTaskDashboard from '../../../components/admin/AssignmentTaskDashboard';

export default function ProofreaderDashboardPage() {
  return (
    <AssignmentTaskDashboard
      kind="proofreader"
      title="Proofreader Desk"
      description="Review assigned proofing work, access permitted files, upload proof files, and mark manuscripts ready for publication."
      endpoint="/admin/my-production-assignments?role=proofreader"
    />
  );
}
