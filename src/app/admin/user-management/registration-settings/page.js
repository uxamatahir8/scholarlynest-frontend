'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import { useRouter } from 'next/navigation';
import {
  Settings, RefreshCw, ShieldAlert, Info, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';

export default function RegistrationSettingsPage() {
  const { user: authUser, hasRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isSuperAdmin = authUser && hasRole('super_admin');

  // Data states
  const [roles, setRoles] = useState([]);
  const [defaultRoleName, setDefaultRoleName] = useState('author');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const [rolesRes, settingsRes] = await Promise.all([
        api.get('/admin/rbac/roles'),
        api.get('/admin/rbac/settings/registration-role')
      ]);
      setRoles(rolesRes.data || []);
      const defRole = settingsRes.data?.default_registration_role || 'author';
      setDefaultRoleName(defRole);
    } catch (err) {
      toast('Failed to load registration role settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isSuperAdmin) {
        router.push('/admin');
      } else {
        fetchData();
      }
    }
  }, [authLoading, isSuperAdmin]);

  const handleUpdateDefaultRegistrationRole = async (roleName) => {
    setUpdating(true);
    try {
      await api.post('/admin/rbac/settings/registration-role', {
        default_registration_role: roleName
      });
      setDefaultRoleName(roleName);
      toast(`Default registration role updated to: ${roleName}`, 'success');
    } catch (err) {
      toast('Failed to update registration settings.', 'error');
    } finally {
      setUpdating(false);
    }
  };

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
      <title>Registration Settings - ScholarlyNest</title>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Registration Settings
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5 font-medium max-w-2xl">
            Configure system permissions, administer roles, and customize default registration properties inside our unified security workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 border border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 text-xs py-2 px-3 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Querying Settings...</span>
        </div>
      ) : (
        <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md max-w-2xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-[var(--muted)]" />
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">Global Registration Properties</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Govern the default permissions set allocated automatically to newly registered authors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs flex items-start gap-2.5 max-w-lg leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Exclusivity Rule Enforced:</strong> Selecting one role as default means no other role can act as default at the same time. The database configuration will be updated instantly.
              </span>
            </div>

            <div className="space-y-2.5 max-w-xs">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Default Registration Role</label>
              <select
                value={defaultRoleName}
                onChange={(e) => handleUpdateDefaultRegistrationRole(e.target.value)}
                disabled={updating}
                className="w-full text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-md focus:outline-none text-[var(--foreground)] cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>{r.display_name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
