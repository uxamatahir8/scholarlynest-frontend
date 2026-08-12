'use client';

import DeskObserverContext from '../../../components/admin/desk-observer/DeskObserverContext';
import EditorDeskList from '../../../components/admin/editor/EditorDeskList';

export default function EditorDeskPage() {
  return (
    <DeskObserverContext roles={['editor', 'super_editor', 'magazine_editor', 'journal_editor']}>
      {({ observerMode, observerUser, observerParams }) => (
        <EditorDeskList observerMode={observerMode} observerUser={observerUser} observerParams={observerParams} />
      )}
    </DeskObserverContext>
  );
}
