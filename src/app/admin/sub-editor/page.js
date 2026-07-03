'use client';

import AssignmentDashboardWorkspace from '../../../components/admin/dashboard/AssignmentDashboardWorkspace';

export default function SubEditorDashboardPage() {
  return (
    <AssignmentDashboardWorkspace
      title="Sub Editor Desk"
      description="Review assigned manuscripts, prepare recommendations, and continue editor-facing workflow tasks."
      endpoint="/admin/my-sub-editor-assignments"
      primaryHref="/admin/sub-editor"
      primaryLabel="Review Assigned Articles"
      activeTitle="Assigned Articles"
      activeDescription="Manuscripts waiting for your recommendation or follow-up."
      emptyActive="No assigned manuscript is waiting for your recommendation right now."
      emptyCompleted="Completed recommendations will appear here after submission."
    />
  );
}
