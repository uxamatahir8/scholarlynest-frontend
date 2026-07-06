'use client';

import DeskObserverContext from '../../../components/admin/desk-observer/DeskObserverContext';
import SubEditorDeskList from '../../../components/admin/sub-editor/SubEditorDeskList';

export default function SubEditorDashboardPage() {
  return (
    <DeskObserverContext fixedRole="sub_editor">
      {({ observerMode, observerUser, observerParams }) => (
        <SubEditorDeskList
          observerMode={observerMode}
          observerUser={observerUser}
          observerParams={observerParams}
        />
      )}
    </DeskObserverContext>
  );
}
