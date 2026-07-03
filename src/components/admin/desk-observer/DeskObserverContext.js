'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LoadingState from '../../ui/LoadingState';
import DeskObserverBanner from './DeskObserverBanner';
import DeskObserverSelector from './DeskObserverSelector';
import { observerApiParam, observerParam } from './deskObserverUtils';

export default function DeskObserverContext({ fixedRole, roles, children }) {
  const searchParams = useSearchParams();
  const [observerUser, setObserverUser] = useState(null);
  const [resolved, setResolved] = useState(!searchParams.get(observerParam));
  const [selectorKey, setSelectorKey] = useState(0);
  const observerMode = Boolean(observerUser);
  const requestedObserver = Boolean(searchParams.get(observerParam));

  const observerParams = useMemo(() => observerApiParam(observerUser), [observerUser]);
  const showSelector = useCallback(() => setSelectorKey((current) => current + 1), []);

  return (
    <div className="space-y-4">
      <DeskObserverSelector
        key={selectorKey}
        fixedRole={fixedRole}
        roles={roles}
        selectedUser={observerUser}
        onSelectedUser={setObserverUser}
        onResolved={setResolved}
      />
      <DeskObserverBanner
        observerUser={observerUser}
        onChangeUser={showSelector}
        onClear={() => setObserverUser(null)}
      />
      {requestedObserver && !resolved ? (
        <LoadingState label="Loading observer desk..." className="min-h-[240px]" />
      ) : (
        children({ observerMode, observerUser, observerParams })
      )}
    </div>
  );
}
