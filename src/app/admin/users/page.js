'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import Alert from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import LoadingState from '../../../components/ui/LoadingState';
import Pagination from '../../../components/ui/Pagination';
import UserList from '../../../components/admin/users/UserList';
import UserManagementFilters from '../../../components/admin/users/UserManagementFilters';
import ImpersonationConfirmationDialog from '../../../components/admin/users/ImpersonationConfirmationDialog';
import { normalizeUserPage, USER_PER_PAGE } from '../../../utils/userManagement';

export default function UserAccountsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: authUser, hasRole, loading: authLoading, impersonationStatus, startImpersonationSession } = useAuth();
  const { toast } = useToast();

  const canUsePage = Boolean(authUser && hasRole('super_admin') && !impersonationStatus?.active);
  const initialSearch = searchParams.get('search') || '';
  const initialRole = searchParams.get('role') || 'all';
  const page = normalizeUserPage(searchParams.get('page'));

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [impersonateTarget, setImpersonateTarget] = useState(null);
  const [impersonating, setImpersonating] = useState(false);

  const currentUrl = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || (key === 'page' && Number(value) <= 1)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    const query = next.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    if (nextUrl !== currentUrl) router.push(nextUrl, { scroll: false });
  };

  useEffect(() => {
    if (authLoading) return;
    if (!canUsePage) router.replace('/admin');
  }, [authLoading, canUsePage, router]);

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlRole = searchParams.get('role') || 'all';
    setSearchQuery(urlSearch);
    setDebouncedSearch(urlSearch);
    setRoleFilter(urlRole);
  }, [searchParams]);

  useEffect(() => {
    if (!canUsePage) return;

    const fetchRoles = async () => {
      try {
        const response = await api.get('/admin/rbac/roles');
        setRoles(response.data || []);
      } catch (error) {
        setRoles([]);
      }
    };

    fetchRoles();
  }, [canUsePage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedSearch(trimmed);
      if (trimmed !== (searchParams.get('search') || '')) {
        updateQuery({ search: trimmed, page: 1 });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = async () => {
    if (!canUsePage) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/admin/users', {
        params: {
          search: debouncedSearch,
          role: roleFilter === 'all' ? undefined : roleFilter,
          page,
          per_page: USER_PER_PAGE,
        },
      });
      setUsers(response.data?.data || []);
      setTotalPages(response.data?.last_page || 1);
      setTotalUsers(response.data?.total || 0);
    } catch (error) {
      setUsers([]);
      setErrorMessage(safeApiMessage(error, 'The user directory could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && canUsePage) fetchUsers();
  }, [authLoading, canUsePage, debouncedSearch, roleFilter, page]);

  const handleImpersonateConfirm = async () => {
    if (!impersonateTarget) return;
    setImpersonating(true);
    try {
      const response = await api.post(`/admin/users/${impersonateTarget.id}/impersonate`, { confirmed: true });
      startImpersonationSession(response.data.user, response.data.access_token);
      toast(`Temporary session started for ${response.data.user.name}.`, 'success');
      router.push('/admin');
    } catch (error) {
      toast(safeApiMessage(error, 'Unable to start impersonation.'), 'error');
    } finally {
      setImpersonating(false);
      setImpersonateTarget(null);
    }
  };

  if (authLoading || (!canUsePage && authUser)) {
    return <LoadingState label="Checking user-management privileges..." className="min-h-[420px]" />;
  }

  if (!canUsePage) {
    return <ErrorState title="Access Restricted">Only non-impersonated Super Admin sessions can manage users.</ErrorState>;
  }

  return (
    <main className="space-y-6">
      <title>User Management - ScholarlyNest</title>

      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">People and Access</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">User Management</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Manage people, account state, role assignment, Sub Editor relationships, and temporary support impersonation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={fetchUsers} disabled={loading} icon={RefreshCw}>Refresh</Button>
          <Link href="/admin/users/create">
            <Button type="button" variant="primary" icon={Plus}>Create User</Button>
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <UserManagementFilters
          search={searchQuery}
          role={roleFilter}
          roles={roles}
          onSearchChange={setSearchQuery}
          onRoleChange={(nextRole) => {
            setRoleFilter(nextRole);
            updateQuery({ role: nextRole === 'all' ? '' : nextRole, page: 1 });
          }}
          onClear={() => {
            setSearchQuery('');
            setRoleFilter('all');
            updateQuery({ search: '', role: '', page: 1 });
          }}
          loading={loading}
        />
      </section>

      {errorMessage && <ErrorState title="User directory unavailable">{errorMessage}</ErrorState>}

      {loading ? (
        <LoadingState label="Loading user directory..." className="min-h-[360px]" />
      ) : !errorMessage && users.length === 0 ? (
        <EmptyState icon={Users} title="No users match these filters">
          Try a different name, email, or role filter.
        </EmptyState>
      ) : !errorMessage ? (
        <>
          <Alert tone="info" title="Directory scope">
            This view uses the existing Super Admin-only user directory endpoint. It does not expose passwords, tokens, raw permissions, or audit records.
          </Alert>
          <UserList
            users={users}
            authUser={authUser}
            impersonationStatus={impersonationStatus}
            onImpersonate={setImpersonateTarget}
          />
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              Showing page <span className="font-bold text-[var(--foreground)]">{page}</span> of{' '}
              <span className="font-bold text-[var(--foreground)]">{totalPages}</span> for{' '}
              <span className="font-bold text-[var(--foreground)]">{totalUsers}</span> users.
            </p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={(nextPage) => updateQuery({ page: nextPage })} label="User directory pagination" />
          </div>
        </>
      ) : null}

      <ImpersonationConfirmationDialog
        open={Boolean(impersonateTarget)}
        user={impersonateTarget}
        loading={impersonating}
        onCancel={() => setImpersonateTarget(null)}
        onConfirm={handleImpersonateConfirm}
      />
    </main>
  );
}
