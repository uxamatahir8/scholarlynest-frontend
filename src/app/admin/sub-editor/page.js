'use client';

import AssignmentDashboardWorkspace from '../../../components/admin/dashboard/AssignmentDashboardWorkspace';
import DeskObserverContext from '../../../components/admin/desk-observer/DeskObserverContext';

export default function SubEditorDashboardPage() {
  return (
    <DeskObserverContext fixedRole="sub_editor">
      {({ observerMode, observerUser, observerParams }) => (
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
          observerMode={observerMode}
          observerUser={observerUser}
          observerParams={observerParams}
        />
      )}
    </DeskObserverContext>
  );
}
