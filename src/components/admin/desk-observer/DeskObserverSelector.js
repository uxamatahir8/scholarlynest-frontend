'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import api from '../../../utils/api';
import { logError } from '../../../utils/safeLogger';
import { safeApiMessage } from '../../../utils/safeErrors';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import Field from '../../ui/Field';
import { Select } from '../../ui/Input';
import {
  normalizeObserverRole,
  observerParam,
  observerRoleLabel,
  observerRoleParam,
  observerRoles,
  observerUserId,
} from './deskObserverUtils';

export default function DeskObserverSelector({
  roles,
  fixedRole,
  selectedUser,
  onSelectedUser,
  onResolved,
  className = '',
}) {
  const { user, hasRole, impersonationStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allowedRoles = useMemo(() => (
    fixedRole ? [normalizeObserverRole(fixedRole)] : (roles || []).map(normalizeObserverRole)
  ), [fixedRole, roles]);
  const initialRole = normalizeObserverRole(searchParams.get(observerRoleParam)) || allowedRoles[0];
  const [selectedRole, setSelectedRole] = useState(allowedRoles.includes(initialRole) ? initialRole : allowedRoles[0]);
  const [selectedId, setSelectedId] = useState(searchParams.get(observerParam) || '');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');

  const canUseObserver = Boolean(user && hasRole('super_admin') && !impersonationStatus?.active && allowedRoles.length);

  useEffect(() => {
    setSelectedId(searchParams.get(observerParam) || '');
    const roleFromUrl = normalizeObserverRole(searchParams.get(observerRoleParam));
    if (!fixedRole && allowedRoles.includes(roleFromUrl)) setSelectedRole(roleFromUrl);
  }, [searchParams, fixedRole, allowedRoles]);

  useEffect(() => {
    if (!canUseObserver || !selectedRole) return;
    let active = true;
    const loadUsers = async () => {
      try {
        onResolved?.(false);
        setLoadingUsers(true);
        setError('');
        const response = await api.get('/admin/desk-observer/users', { params: { role: selectedRole } });
        if (!active) return;
        const nextUsers = response.data?.users || [];
        setUsers(nextUsers);
        const activeId = observerUserId(searchParams);
        const matched = nextUsers.find((item) => Number(item.id) === Number(activeId)) || null;
        onSelectedUser(matched);
        if (activeId && !matched) {
          setError('The selected observer user is not available for this desk.');
        }
        onResolved?.(true);
      } catch (err) {
        logError('Failed to load observer users:', err);
        if (active) {
          setUsers([]);
          onSelectedUser(null);
          setError(safeApiMessage(err, 'Unable to load desk observer users.'));
          onResolved?.(true);
        }
      } finally {
        if (active) setLoadingUsers(false);
      }
    };

    loadUsers();
    return () => {
      active = false;
    };
  }, [canUseObserver, selectedRole, searchParams, onSelectedUser, onResolved]);

  const updateUrl = (updates) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, String(value));
    });
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const openDesk = () => {
    if (!selectedId) return;
    updateUrl({
      [observerParam]: selectedId,
      [observerRoleParam]: fixedRole ? null : selectedRole,
    });
  };

  const clearObserver = () => {
    setSelectedId('');
    onSelectedUser(null);
    updateUrl({ [observerParam]: null, [observerRoleParam]: null });
  };

  if (!canUseObserver) return null;

  return (
    <section className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 ${className}`} aria-label="Desk observer selector">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[var(--muted)]">Desk Observer</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Select a user to review assigned work without impersonation.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {!fixedRole && (
              <Field label="Role">
                <Select
                  value={selectedRole}
                  onChange={(event) => {
                    setSelectedRole(event.target.value);
                    setSelectedId('');
                    updateUrl({ [observerParam]: null, [observerRoleParam]: event.target.value });
                  }}
                >
                  {allowedRoles.map((role) => <option key={role} value={role}>{observerRoles[role] || role}</option>)}
                </Select>
              </Field>
            )}
            {fixedRole && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Role</span>
                <span className="mt-1 block text-sm font-bold text-[var(--foreground)]">{observerRoleLabel(selectedRole)}</span>
              </div>
            )}
            <Field label="User">
              <Select
                value={selectedId}
                disabled={loadingUsers || users.length === 0}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                <option value="">{loadingUsers ? 'Loading users...' : `Select ${observerRoleLabel(selectedRole)}`}</option>
                {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" icon={Eye} disabled={!selectedId || loadingUsers} onClick={openDesk}>
            Open Assigned Desk
          </Button>
          {(selectedUser || searchParams.get(observerParam)) && (
            <Button type="button" variant="outline" icon={X} onClick={clearObserver}>
              Clear
            </Button>
          )}
        </div>
      </div>
      {!loadingUsers && users.length === 0 && (
        <EmptyState className="mt-4 p-4" title={`No ${observerRoleLabel(selectedRole)} users found`}>
          No eligible users exist for this desk role.
        </EmptyState>
      )}
      {error && <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </section>
  );
}
