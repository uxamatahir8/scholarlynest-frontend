'use client';

import DeskObserverContext from '../../../components/admin/desk-observer/DeskObserverContext';
import CopyEditorTaskList from '../../../components/admin/production/CopyEditorTaskList';

export default function CopyEditorDashboardPage() {
  return (
    <DeskObserverContext fixedRole="copy_editor">
      {({ observerMode, observerUser, observerParams }) => (
        <CopyEditorTaskList
          observerMode={observerMode}
          observerUser={observerUser}
          observerParams={observerParams}
        />
      )}
    </DeskObserverContext>
  );
}
