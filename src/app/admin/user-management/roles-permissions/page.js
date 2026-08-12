'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, RefreshCw, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import { safeApiMessage } from '../../../../utils/safeErrors';
import Alert from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';
import Dialog from '../../../../components/ui/Dialog';
import EmptyState from '../../../../components/ui/EmptyState';
import ErrorState from '../../../../components/ui/ErrorState';
import Field from '../../../../components/ui/Field';
import { Input } from '../../../../components/ui/Input';
import LoadingState from '../../../../components/ui/LoadingState';
import { permissionCategory, permissionLabel, roleAccessAreas, rolePurpose } from '../../../../utils/userManagement';
import { roleCreateSchema, validateWithZod } from '../../../../lib/validation';

const PROTECTED_PERMISSION_NAMES = new Set([
  'roles.view-any',
  'roles.manage',
  'users.view-any',
  'users.create',
  'users.manage',
  'settings.manage',
]);

const isProtectedPermission = (permissionName = '') => (
  PROTECTED_PERMISSION_NAMES.has(permissionName)
  || permissionName.includes('.delete')
  || permissionName.includes('impersonat')
);

export default function RolesPermissionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, hasRole, loading: authLoading, impersonationStatus } = useAuth();
  const canUsePage = Boolean(authUser && hasRole('super_admin') && !impersonationStatus?.active);

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingPermission, setUpdatingPermission] = useState(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRole, setNewRole] = useState({ display_name: '', name: '', description: '' });
  const [createErrors, setCreateErrors] = useState({});
  const [creatingRole, setCreatingRole] = useState(false);
  const [deleteRole, setDeleteRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());

  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) || roles[0] || null, [roles, selectedRoleId]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((groups, permission) => {
      const category = permissionCategory(permission.name || permission.module);
      if (!groups[category]) groups[category] = [];
      groups[category].push(permission);
      return groups;
    }, {});
  }, [permissions]);
  const permissionCategories = useMemo(() => Object.keys(groupedPermissions), [groupedPermissions]);

  useEffect(() => {
    if (permissionCategories.length === 0) return;
    setExpandedCategories((current) => current.size > 0 ? current : new Set([permissionCategories[0]]));
  }, [permissionCategories]);

  const toggleCategory = (category) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const selectedPermissionIds = useMemo(() => new Set((selectedRole?.permissions || []).map((permission) => permission.id)), [selectedRole]);
  const selectedAreas = selectedRole ? roleAccessAreas(selectedRole, selectedRole.permissions) : [];
  const selectedLocked = Boolean(selectedRole?.is_locked || selectedRole?.is_system);

  const fetchData = async () => {
    if (!canUsePage) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        api.get('/admin/rbac/roles'),
        api.get('/admin/rbac/permissions'),
      ]);
      const nextRoles = rolesResponse.data || [];
      setRoles(nextRoles);
      setPermissions(permissionsResponse.data || []);
      setSelectedRoleId((current) => nextRoles.some((role) => role.id === current) ? current : nextRoles[0]?.id || null);
    } catch (error) {
      setErrorMessage(safeApiMessage(error, 'Roles and permissions could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!canUsePage) {
      router.replace('/admin');
      return;
    }
    fetchData();
  }, [authLoading, canUsePage, router]);

  const handleTogglePermission = async (permission) => {
    if (!selectedRole) return;
    if (selectedLocked) {
      toast('System role permissions are read-only.', 'error');
      return;
    }
    if (isProtectedPermission(permission.name)) {
      toast('Protected Super Admin, deletion, and impersonation permissions cannot be assigned here.', 'error');
      return;
    }

    const currentIds = (selectedRole.permissions || []).map((item) => item.id);
    const nextIds = selectedPermissionIds.has(permission.id)
      ? currentIds.filter((id) => id !== permission.id)
      : [...currentIds, permission.id];

    setUpdatingPermission(permission.id);
    try {
      const response = await api.post(`/admin/rbac/roles/${selectedRole.id}/permissions`, { permissions: nextIds });
      setRoles((currentRoles) => currentRoles.map((role) => role.id === selectedRole.id ? { ...role, permissions: response.data.permissions || [] } : role));
      toast('Role permissions updated.', 'success');
    } catch (error) {
      toast(safeApiMessage(error, 'Permissions could not be updated.'), 'error');
    } finally {
      setUpdatingPermission(null);
    }
  };

  const handleCreateRole = async (event) => {
    event.preventDefault();
    const validation = validateWithZod(roleCreateSchema, newRole);
    setCreateErrors(validation.errors);
    if (!validation.success) return;

    setCreatingRole(true);
    try {
      const response = await api.post('/admin/rbac/roles', newRole);
      const rolesResponse = await api.get('/admin/rbac/roles');
      const nextRoles = rolesResponse.data || [];
      setRoles(nextRoles);
      setSelectedRoleId(response.data?.id || nextRoles[0]?.id || null);
      setNewRole({ display_name: '', name: '', description: '' });
      setShowCreateRole(false);
      toast('Custom role created.', 'success');
    } catch (error) {
      const apiErrors = error?.response?.data?.errors || {};
      setCreateErrors({
        name: apiErrors.name?.[0],
        display_name: apiErrors.display_name?.[0],
        description: apiErrors.description?.[0],
      });
      toast(safeApiMessage(error, 'Custom role could not be created.'), 'error');
    } finally {
      setCreatingRole(false);
    }
  };

  const executeDeleteRole = async () => {
    if (!deleteRole) return;
    setDeletingRole(true);
    try {
      await api.delete(`/admin/rbac/roles/${deleteRole.id}`);
      const rolesResponse = await api.get('/admin/rbac/roles');
      const nextRoles = rolesResponse.data || [];
      setRoles(nextRoles);
      setSelectedRoleId(nextRoles[0]?.id || null);
      toast('Custom role deleted.', 'success');
    } catch (error) {
      toast(safeApiMessage(error, 'Custom role could not be deleted.'), 'error');
    } finally {
      setDeletingRole(false);
      setDeleteRole(null);
    }
  };

  if (authLoading || (!canUsePage && authUser)) {
    return <LoadingState label="Checking role-management privileges..." className="min-h-[420px]" />;
  }

  if (!canUsePage) {
    return <ErrorState title="Access Restricted">Only non-impersonated Super Admin sessions can view role management.</ErrorState>;
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">People and Access</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Roles and Permissions</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Review protected system roles and manage custom-role access without exposing a raw permission wall.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={fetchData} disabled={loading} icon={RefreshCw}>Refresh</Button>
          <Button type="button" variant="primary" onClick={() => setShowCreateRole(true)} icon={Plus}>Create Custom Role</Button>
        </div>
      </header>

      {errorMessage && <ErrorState title="Role matrix unavailable">{errorMessage}</ErrorState>}

      {loading ? (
        <LoadingState label="Loading role access map..." className="min-h-[360px]" />
      ) : roles.length === 0 ? (
        <EmptyState icon={Shield} title="No roles are available">The backend returned no role records.</EmptyState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="border border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>System roles are locked. Custom roles can use supported controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.map((role) => {
                const selected = selectedRole?.id === role.id;
                const locked = role.is_locked || role.is_system;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${selected ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)]'}`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block text-sm font-bold">{role.display_name}</span>
                        <span className={`mt-1 block text-xs ${selected ? 'text-white/80' : 'text-[var(--muted)]'}`}>{rolePurpose(role)}</span>
                      </span>
                      <Badge variant={locked ? 'default' : 'success'} className={selected ? 'border-white/25 bg-white/15 text-white' : ''}>{locked ? 'System' : 'Custom'}</Badge>
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <section className="space-y-5">
            <Card className="border border-[var(--border)] bg-[var(--surface)]">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{selectedRole.display_name}</CardTitle>
                    <CardDescription>{selectedRole.description || rolePurpose(selectedRole)}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={selectedLocked ? 'default' : 'success'}>{selectedLocked ? 'Locked System Role' : 'Editable Custom Role'}</Badge>
                    {!selectedLocked && (
                      <Button type="button" variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteRole(selectedRole)}>Delete Custom Role</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--foreground)]">Access Areas</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedAreas.map((area) => <Badge key={area} variant="outline">{area}</Badge>)}
                  </div>
                </div>
                <Alert tone={selectedLocked ? 'warning' : 'info'} title={selectedLocked ? 'Protected system role' : 'Custom role controls'}>
                  {selectedLocked
                    ? 'This predefined role is managed by platform configuration. Permission controls are read-only here.'
                    : 'Only supported permissions can be assigned. Super Admin, deletion, and impersonation permissions remain protected.'}
                </Alert>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => setExpandedCategories(new Set(permissionCategories))}>Expand all</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setExpandedCategories(new Set())}>Collapse all</Button>
              </div>
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                const expanded = expandedCategories.has(category);
                const assignedCount = categoryPermissions.filter((permission) => selectedPermissionIds.has(permission.id)).length;
                const panelId = `permission-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

                return (
                <Card key={category} className="overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"
                  >
                    <span className="min-w-0">
                      <span className="block font-serif text-xl font-bold text-[var(--foreground)]">{category}</span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">
                        {categoryPermissions.length} permission{categoryPermissions.length === 1 ? '' : 's'} · {assignedCount} assigned
                      </span>
                    </span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-[var(--muted)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {expanded && <CardContent id={panelId} className="grid gap-2 border-t border-[var(--border)] pt-4">
                    {categoryPermissions.map((permission) => {
                      const assigned = selectedPermissionIds.has(permission.id);
                      const protectedPermission = isProtectedPermission(permission.name);
                      const locked = selectedLocked || protectedPermission;
                      return (
                        <label key={permission.id} className={`flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 ${locked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:bg-[var(--surface-muted)]'}`}>
                          <input
                            type="checkbox"
                            checked={assigned}
                            disabled={locked || updatingPermission === permission.id}
                            onChange={() => handleTogglePermission(permission)}
                            className="mt-1 h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus-visible:ring-[var(--focus-ring)]"
                            aria-label={`${assigned ? 'Remove' : 'Assign'} ${permissionLabel(permission)}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-[var(--foreground)]">{permissionLabel(permission)}</span>
                            {permission.description && <span className="mt-1 block text-xs text-[var(--muted)]">{permission.description}</span>}
                            <span className="mt-1 block text-[10px] font-mono text-[var(--muted)]">{permission.name}</span>
                          </span>
                          <Badge variant={assigned ? 'success' : 'default'}>{assigned ? 'Assigned' : 'Off'}</Badge>
                        </label>
                      );
                    })}
                  </CardContent>}
                </Card>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <Dialog
        open={showCreateRole}
        onClose={() => setShowCreateRole(false)}
        title="Create Custom Role"
        description="Custom roles start without permissions and cannot receive protected Super Admin controls."
        footer={(
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateRole(false)} disabled={creatingRole}>Cancel</Button>
            <Button type="submit" form="create-role-form" variant="primary" size="sm" isLoading={creatingRole}>Create Role</Button>
          </>
        )}
      >
        <form id="create-role-form" onSubmit={handleCreateRole} className="space-y-4">
          <Field label="Display Name" required error={createErrors.display_name}>
            <Input
              value={newRole.display_name}
              onChange={(event) => {
                const value = event.target.value;
                setNewRole((current) => ({
                  ...current,
                  display_name: value,
                  name: current.name || value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''),
                }));
              }}
              placeholder="Senior Reviewer"
            />
          </Field>
          <Field label="Role Identifier" required error={createErrors.name} helperText="Used by backend role configuration. Reserved system names are rejected.">
            <Input
              value={newRole.name}
              onChange={(event) => setNewRole((current) => ({ ...current, name: event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') }))}
              placeholder="senior-reviewer"
            />
          </Field>
          <Field label="Purpose" error={createErrors.description}>
            <Input value={newRole.description} onChange={(event) => setNewRole((current) => ({ ...current, description: event.target.value }))} placeholder="Optional plain-language purpose" />
          </Field>
        </form>
      </Dialog>

      <ConfirmationModal
        isOpen={Boolean(deleteRole)}
        title="Delete Custom Role?"
        message={`Delete "${deleteRole?.display_name || deleteRole?.name}"? Backend rules prevent deleting assigned or protected roles.`}
        confirmText="Delete Role"
        cancelText="Cancel"
        onConfirm={executeDeleteRole}
        onCancel={() => setDeleteRole(null)}
        isLoading={deletingRole}
      />
    </main>
  );
}
