'use client';

import AssignmentDashboardWorkspace from '../../../components/admin/dashboard/AssignmentDashboardWorkspace';
import DeskObserverContext from '../../../components/admin/desk-observer/DeskObserverContext';

export default function CopyEditorDashboardPage() {
  return (
    <DeskObserverContext fixedRole="copy_editor">
      {({ observerMode, observerUser, observerParams }) => (
        <AssignmentDashboardWorkspace
          title="Copy Editor Desk"
          description="Work through assigned copyediting tasks, permitted manuscript files, and production handoff."
          endpoint="/admin/my-production-assignments?role=copy_editor"
          primaryHref="/admin/copy-editor"
          primaryLabel="Open Copyediting Tasks"
          activeTitle="Assigned Copyediting Tasks"
          activeDescription="Production assignments waiting for copyediting action."
          emptyActive="No copyediting task is assigned right now."
          emptyCompleted="Completed copyediting tasks will appear here."
          observerMode={observerMode}
          observerUser={observerUser}
          observerParams={observerParams}
        />
      )}
    </DeskObserverContext>
  );
}
