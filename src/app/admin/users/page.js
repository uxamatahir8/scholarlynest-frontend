'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, RefreshCw, ShieldAlert, Search, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import RoleBadge from '../../../components/ui/RoleBadge';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import { hasRole as userHasRole } from '../../../utils/roles';

export default function UserAccountsPage() {
  const { user: authUser, hasRole, loading: authLoading, impersonationStatus, startImpersonationSession } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [impersonateTarget, setImpersonateTarget] = useState(null);

  const handleImpersonateConfirm = async () => {
    if (!impersonateTarget) return;
    try {
      const res = await api.post(`/admin/users/${impersonateTarget.id}/impersonate`, { confirmed: true });
      const { user: targetUserData, access_token } = res.data;
      startImpersonationSession(targetUserData, access_token);
      toast(`Logged in as ${targetUserData.name} successfully.`, 'success');
      router.push('/admin');
    } catch (err) {
      toast('Unable to start impersonation. Please try again.', 'error');
    } finally {
      setImpersonateTarget(null);
    }
  };

  // Query States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const perPage = 20;

  const isSuperAdmin = authUser && hasRole('super_admin');

  // 1. Debounce the Search Input (300-500ms target)
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedSearch(trimmed);
      setPage(1); // Reset page to 1 on query changes
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // 2. Fetch User Directory
  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users', {
        params: {
          search: debouncedSearch,
          page: page,
          per_page: perPage
        }
      });
      setUsers(res.data?.data || []);
      setTotalPages(res.data?.last_page || 1);
      setTotalUsers(res.data?.total || 0);
    } catch (err) {
      setError('An error occurred while loading the user directory.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isSuperAdmin) {
        router.push('/admin');
      } else {
        fetchUsers();
      }
    }
  }, [authLoading, isSuperAdmin, debouncedSearch, page]);

  if (authLoading || (!isSuperAdmin && authUser)) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess Super Admin privileges to view and configure team access controls.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <title>User Accounts - ScholarlyNest</title>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            User Accounts
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5 font-medium max-w-2xl">
            Inspect active personnel accounts, view workflow roles, and monitor system-wide user credentials.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 text-xs py-2 h-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Link href="/admin/users/create" passHref legacyBehavior>
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 h-auto cursor-pointer font-bold rounded-lg border border-amber-600 hover:border-amber-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[var(--muted)]" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">System User Directory</CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">
                A read-only catalog of all registered platform personnel.
              </CardDescription>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or role"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold pl-9 pr-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-[var(--foreground)]"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          {error ? (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <h4 className="text-xs font-bold text-[var(--foreground)]">Query Failed</h4>
              <p className="text-xs text-[var(--muted)] max-w-md">{error}</p>
            </div>
          ) : loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Querying User Records...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 px-6 text-center text-xs text-[var(--muted)] font-medium">
              No personnel records match your search criteria.
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--muted-border)] bg-black/5 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Assigned Role</th>
                    <th className="px-6 py-4">Account Status</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--muted-border)]/50 text-xs">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[var(--foreground)]/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-[var(--foreground)] flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {u.profile_image ? (
                            <img src={u.profile_image} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <span className="truncate max-w-[180px]">{u.name}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--muted)] truncate max-w-[200px]">{u.email}</td>
                      <td className="px-6 py-4">
                        <RoleBadge user={u} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={u.status === 'active' ? 'success' : 'warning'}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--muted)]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                        {isSuperAdmin && u.id !== authUser.id && u.status === 'active' && !userHasRole(u, 'super_admin') && !impersonationStatus.active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImpersonateTarget(u)}
                            className="border-amber-500/20 text-amber-600 hover:bg-amber-500/10 dark:text-amber-450 text-[10px] font-bold uppercase py-1 px-2.5 h-auto cursor-pointer rounded-lg shrink-0"
                          >
                            Login as User
                          </Button>
                        )}
                        <Link href={`/admin/users/${u.id}/edit`} passHref legacyBehavior>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 text-[10px] font-bold uppercase py-1 px-2.5 h-auto cursor-pointer rounded-lg shrink-0"
                          >
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--muted-border)] text-xs text-[var(--muted)] font-medium">
                <div>
                  Showing page <span className="font-bold text-[var(--foreground)]">{page}</span> of{' '}
                  <span className="font-bold text-[var(--foreground)]">{totalPages}</span> ({totalUsers} users total)
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page <= 1}
                    className="p-1 h-auto cursor-pointer border-[var(--muted-border)]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    className="p-1 h-auto cursor-pointer border-[var(--muted-border)]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Impersonation Confirmation Modal */}
      {impersonateTarget && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--card-bg)] border border-[var(--muted-border)] max-w-sm w-full rounded-2xl shadow-xl p-6 space-y-4 animate-in zoom-in-95 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">Confirm Impersonation</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              You are about to log in as <span className="font-bold text-[var(--foreground)]">{impersonateTarget.name}</span>. Your current session will switch to the target user. Do you wish to continue?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImpersonateTarget(null)}
                className="text-xs border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 font-bold cursor-pointer rounded-lg"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleImpersonateConfirm}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer rounded-lg"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
