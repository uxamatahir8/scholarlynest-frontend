'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../utils/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, RefreshCw, Plus, UserCheck, ShieldAlert, Search, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export default function UserAccountsPage() {
  const { user: authUser, hasRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = authUser && hasRole('super_admin');

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const res = await api.get('/admin/rbac/users');
      setUsers(res.data || []);
    } catch (err) {
      toast('Failed to load user directory.', 'error');
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
  }, [authLoading, isSuperAdmin]);

  const filteredUsers = users.filter(u => {
    if (u.id === authUser?.id) return false;
    const query = searchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(query);
    const emailMatch = u.email?.toLowerCase().includes(query);
    const roleMatch = (u.role?.display_name || '').toLowerCase().includes(query);
    const universityMatch = (u.university_name || '').toLowerCase().includes(query);
    return nameMatch || emailMatch || roleMatch || universityMatch;
  });

  if (authLoading || (!isSuperAdmin && authUser)) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-bold text-zinc-405 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
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
            Inspect active personnel accounts, assign workflow roles, and configure magazine affiliations.
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
                Inspect active personnel accounts and update their single system access role.
              </CardDescription>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold pl-9 pr-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-[var(--foreground)]"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Querying User Records...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--muted)]">
              No matching user accounts found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--muted-border)] bg-black/5 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">University</th>
                  <th className="px-6 py-4">Assigned Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--muted-border)]/50 text-xs">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--foreground)]/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--foreground)] flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <span className="truncate max-w-[180px]">{u.name}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[var(--muted)] truncate max-w-[200px]">{u.email}</td>
                    <td className="px-6 py-4 font-medium text-[var(--muted)] truncate max-w-[180px]">{u.university_name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={u.role?.name === 'super_admin' ? 'gold' : u.role?.name === 'editor' ? 'default' : 'outline'}>
                        {u.role?.display_name || 'No Role Assigned'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
