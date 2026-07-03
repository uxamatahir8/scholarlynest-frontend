'use client';

import PublisherDashboardWorkspace from '../../../components/admin/dashboard/PublisherDashboardWorkspace';
import DeskObserverContext from '../../../components/admin/desk-observer/DeskObserverContext';

export default function PublisherDashboardPage() {
  return (
    <DeskObserverContext fixedRole="publisher">
      {({ observerMode, observerUser, observerParams }) => (
        <PublisherDashboardWorkspace
          standalone
          observerMode={observerMode}
          observerUser={observerUser}
          observerParams={observerParams}
        />
      )}
    </DeskObserverContext>
  );
}
