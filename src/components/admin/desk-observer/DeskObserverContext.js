'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import LoadingState from '../../ui/LoadingState';
import DeskObserverBanner from './DeskObserverBanner';
import DeskObserverSelector from './DeskObserverSelector';
import { observerApiParam, observerParam } from './deskObserverUtils';

export default function DeskObserverContext({ fixedRole, roles, children }) {
  const { user, hasRole, impersonationStatus } = useAuth();
  const searchParams = useSearchParams();
  const [observerUser, setObserverUser] = useState(null);
  const canUseObserver = Boolean(user && hasRole('super_admin') && !impersonationStatus?.active);
  const [resolved, setResolved] = useState(!searchParams.get(observerParam) || !canUseObserver);
  const [selectorKey, setSelectorKey] = useState(0);
  const observerMode = Boolean(canUseObserver && observerUser);
  const requestedObserver = Boolean(canUseObserver && searchParams.get(observerParam));

  const observerParams = useMemo(() => (
    canUseObserver ? observerApiParam(observerUser) : {}
  ), [canUseObserver, observerUser]);
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
