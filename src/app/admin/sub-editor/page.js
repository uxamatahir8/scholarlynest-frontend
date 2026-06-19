'use client';

import AssignmentTaskDashboard from '../../../components/admin/AssignmentTaskDashboard';

export default function SubEditorDashboardPage() {
  return (
    <AssignmentTaskDashboard
      kind="sub_editor"
      title="Sub Editor Desk"
      description="Review assigned manuscripts, submit recommendations, add editor-facing notes, and upload annotated files."
      endpoint="/admin/my-sub-editor-assignments"
    />
  );
}
