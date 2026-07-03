'use client';

import PublisherOperationsWorkspace from '../../../components/admin/publication/PublisherOperationsWorkspace';
import DeskObserverContext from '../../../components/admin/desk-observer/DeskObserverContext';

export default function PublisherDashboardPage() {
  return (
    <DeskObserverContext fixedRole="publisher">
      {({ observerMode, observerUser, observerParams }) => (
        <PublisherOperationsWorkspace
          observerMode={observerMode}
          observerUser={observerUser}
          observerParams={observerParams}
        />
      )}
    </DeskObserverContext>
  );
}
