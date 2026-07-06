'use client';

import DeskObserverContext from '../../../components/admin/desk-observer/DeskObserverContext';
import ReviewerDeskList from '../../../components/admin/reviewer/ReviewerDeskList';

export default function ReviewerDashboardPage() {
  return (
    <DeskObserverContext fixedRole="reviewer">
      {({ observerMode, observerUser, observerParams }) => (
        <ReviewerDeskList
          observerMode={observerMode}
          observerUser={observerUser}
          observerParams={observerParams}
        />
      )}
    </DeskObserverContext>
  );
}
