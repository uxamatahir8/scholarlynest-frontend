'use client';

import AssignmentTaskDashboard from '../../../components/admin/AssignmentTaskDashboard';

export default function CopyEditorDashboardPage() {
  return (
    <AssignmentTaskDashboard
      kind="copy_editor"
      title="Copy Editor Desk"
      description="Work through assigned copy editing tasks, review permitted manuscript files, upload copy-edited files, and complete production handoff."
      endpoint="/admin/my-production-assignments?role=copy_editor"
    />
  );
}
