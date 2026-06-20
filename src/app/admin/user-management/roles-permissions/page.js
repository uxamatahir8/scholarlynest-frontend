'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  Key,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  Trash2,
  X
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import { safeApiMessage } from '../../../../utils/safeErrors';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';

const PROTECTED_PERMISSION_NAMES = new Set([
  'roles.view-any',
  'roles.manage',
  'users.view-any',
  'users.create',
  'users.manage',
  'settings.manage'
]);

const moduleLabel = (moduleName) => {
  if (!moduleName) return 'General';
  return moduleName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bSeo\b/g, 'SEO')
    .replace(/\bCms\b/g, 'CMS');
};

const isProtectedPermission = (permissionName) => (
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
  const [updatingPermission, setUpdatingPermission] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [isRoleNameManuallyEdited, setIsRoleNameManuallyEdited] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [creatingRole, setCreatingRole] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState(null);
  const [deleteRoleName, setDeleteRoleName] = useState('');
  const [deletingRole, setDeletingRole] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || roles[0] || null,
    [roles, selectedRoleId]
  );

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((groups, permission) => {
      const moduleName = permission.module || 'general';
      if (!groups[moduleName]) groups[moduleName] = [];
      groups[moduleName].push(permission);
      return groups;
    }, {});
  }, [permissions]);

  const selectedPermissionIds = useMemo(() => {
    return new Set((selectedRole?.permissions || []).map((permission) => permission.id));
  }, [selectedRole]);

  const fetchData = async () => {
    if (!canUsePage) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get('/admin/rbac/roles'),
        api.get('/admin/rbac/permissions')
      ]);
      const nextRoles = rolesRes.data || [];
      setRoles(nextRoles);
      setPermissions(permissionsRes.data || []);
      setSelectedRoleId((currentId) => {
        if (nextRoles.some((role) => role.id === currentId)) return currentId;
        return nextRoles[0]?.id || null;
      });
    } catch (err) {
      setErrorMessage('Roles and permissions could not be loaded.');
      toast('Roles and permissions could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!canUsePage) {
      router.push('/admin');
      return;
    }
    fetchData();
  }, [authLoading, canUsePage]);

  useEffect(() => {
    if (!showCreateRoleModal) {
      setValidationErrors({});
      setIsRoleNameManuallyEdited(false);
    }
  }, [showCreateRoleModal]);

  const clearFieldError = (field) => {
    if (!validationErrors[field]) return;
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCreateRole = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!newRoleDisplayName.trim()) errors.newRoleDisplayName = 'Display Name is required.';
    if (!newRoleName.trim()) errors.newRoleName = 'Role Identifier is required.';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setCreatingRole(true);
    try {
      const res = await api.post('/admin/rbac/roles', {
        name: newRoleName,
        display_name: newRoleDisplayName,
        description: newRoleDescription || null
      });
      const rolesRes = await api.get('/admin/rbac/roles');
      const nextRoles = rolesRes.data || [];
      setRoles(nextRoles);
      setSelectedRoleId(res.data?.id || nextRoles.find((role) => role.name === res.data?.name)?.id || nextRoles[0]?.id || null);
      setNewRoleName('');
      setNewRoleDisplayName('');
      setNewRoleDescription('');
      setShowCreateRoleModal(false);
      toast('Custom role created.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Custom role could not be created.'), 'error');
      const apiErrors = err?.response?.data?.errors || {};
      setValidationErrors({
        newRoleName: apiErrors.name?.[0],
        newRoleDisplayName: apiErrors.display_name?.[0],
        newRoleDescription: apiErrors.description?.[0]
      });
    } finally {
      setCreatingRole(false);
    }
  };

  const syncRolePermissions = async (role, nextPermissionIds, permissionId) => {
    setUpdatingPermission(permissionId);
    try {
      const res = await api.post(`/admin/rbac/roles/${role.id}/permissions`, {
        permissions: nextPermissionIds
      });
      setRoles((currentRoles) => currentRoles.map((item) => (
        item.id === role.id ? { ...item, permissions: res.data.permissions || [] } : item
      )));
      toast('Permissions updated.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Permissions could not be updated.'), 'error');
    } finally {
      setUpdatingPermission(null);
    }
  };

  const handleTogglePermission = (permission) => {
    if (!selectedRole) return;
    if (selectedRole.is_locked || selectedRole.is_system) {
      toast('Locked system role permissions cannot be changed.', 'error');
      return;
    }
    if (isProtectedPermission(permission.name)) {
      toast('Protected Super Admin permissions cannot be assigned to custom roles.', 'error');
      return;
    }

    const currentIds = (selectedRole.permissions || []).map((item) => item.id);
    const nextPermissionIds = selectedPermissionIds.has(permission.id)
      ? currentIds.filter((id) => id !== permission.id)
      : [...currentIds, permission.id];

    syncRolePermissions(selectedRole, nextPermissionIds, permission.id);
  };

  const openDeleteRoleModal = (role) => {
    setDeleteRoleId(role.id);
    setDeleteRoleName(role.display_name || role.name);
    setIsConfirmOpen(true);
  };

  const executeDeleteRole = async () => {
    if (!deleteRoleId) return;

    setDeletingRole(true);
    try {
      await api.delete(`/admin/rbac/roles/${deleteRoleId}`);
      const rolesRes = await api.get('/admin/rbac/roles');
      const nextRoles = rolesRes.data || [];
      setRoles(nextRoles);
      setSelectedRoleId(nextRoles[0]?.id || null);
      toast('Custom role deleted.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Custom role could not be deleted.'), 'error');
    } finally {
      setDeletingRole(false);
      setIsConfirmOpen(false);
      setDeleteRoleId(null);
      setDeleteRoleName('');
    }
  };

  if (authLoading || (!canUsePage && authUser)) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Checking privileges...</span>
      </div>
    );
  }

  if (!canUsePage) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg flex items-start space-x-4">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">Only non-impersonated Super Admin sessions can view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <title>Roles & Permission Matrix - ScholarlyNest</title>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Roles & Permission Matrix
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5 font-medium max-w-2xl">
            Review locked system roles and assign approved permissions to custom roles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateRoleModal(true)}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.03] px-4 py-3 flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Loading matrix...</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--muted-border)] rounded-lg bg-[var(--card-bg)] text-[var(--muted)]">
          <Key className="w-8 h-8 mx-auto opacity-50 mb-3" />
          <span className="text-xs font-semibold">No roles are available.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-4 space-y-4">
            <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md rounded-lg overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">Roles</CardTitle>
                <CardDescription className="text-[10px]">System roles are read-only; custom roles can be configured.</CardDescription>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {roles.map((role) => {
                  const isSelected = selectedRole?.id === role.id;
                  const isLocked = role.is_locked || role.is_system;
                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedRoleId(role.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg transition-all text-left ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white shadow-sm'
                          : 'hover:bg-[var(--foreground)]/5 text-[var(--muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <span className="min-w-0 flex items-center gap-2.5">
                        {isLocked ? <Lock className="w-4 h-4 shrink-0" /> : <Shield className="w-4 h-4 shrink-0" />}
                        <span className="min-w-0">
                          <span className="text-xs block font-bold truncate">{role.display_name}</span>
                          <span className={`text-[9px] block truncate ${isSelected ? 'text-zinc-200' : 'text-zinc-400'}`}>{role.name}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <Badge variant={isLocked ? 'default' : 'success'} className={isSelected ? 'bg-white/20 border-white/20 text-white' : ''}>
                          {isLocked ? 'System' : 'Custom'}
                        </Badge>
                        {!isLocked && (
                          <button
                            type="button"
                            title="Delete custom role"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDeleteRoleModal(role);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                openDeleteRoleModal(role);
                              }
                            }}
                            className="p-1 rounded text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-8">
            {selectedRole ? (
              <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md rounded-lg overflow-hidden">
                <CardHeader className="border-b border-[var(--muted-border)]/55 pb-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-sm font-bold text-[var(--foreground)]">
                        {selectedRole.display_name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {selectedRole.description || 'No description has been configured for this role.'}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={selectedRole.is_locked || selectedRole.is_system ? 'default' : 'success'}>
                        {selectedRole.is_locked || selectedRole.is_system ? 'Locked System Role' : 'Editable Custom Role'}
                      </Badge>
                      <Badge variant={selectedRole.name === 'super_admin' ? 'gold' : 'primary'}>{selectedRole.name}</Badge>
                    </div>
                  </div>
                  {(selectedRole.is_locked || selectedRole.is_system) && (
                    <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 flex items-start gap-3">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                        This role is part of the protected workflow baseline. Its name, label, and mandatory permissions are managed by the platform.
                      </p>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead className="bg-[var(--foreground)]/[0.03] border-b border-[var(--muted-border)]">
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Permission</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Module</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">State</th>
                          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Enabled</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--muted-border)]/60">
                        {Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) => (
                          <React.Fragment key={moduleName}>
                            <tr className="bg-[var(--foreground)]/[0.015]">
                              <td colSpan={4} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]">
                                {moduleLabel(moduleName)}
                              </td>
                            </tr>
                            {modulePermissions.map((permission) => {
                              const checked = selectedPermissionIds.has(permission.id);
                              const locked = selectedRole.is_locked || selectedRole.is_system || isProtectedPermission(permission.name);
                              const updating = updatingPermission === permission.id;
                              return (
                                <tr key={permission.id} className="align-top">
                                  <td className="px-4 py-3">
                                    <div className="space-y-1">
                                      <div className="text-xs font-bold text-[var(--foreground)]">{permission.display_name || permission.name}</div>
                                      <div className="text-[10px] font-mono text-[var(--muted)]">{permission.name}</div>
                                      {permission.description && (
                                        <div className="text-[11px] text-[var(--muted)] max-w-md">{permission.description}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="default">{moduleLabel(permission.module)}</Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                                      {checked ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                      {checked ? 'Assigned' : 'Not Assigned'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <label className={`inline-flex items-center gap-2 ${locked ? 'cursor-not-allowed opacity-65' : 'cursor-pointer'}`} title={locked ? 'This permission cannot be changed for this role.' : 'Toggle permission'}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={locked || updating}
                                        onChange={() => handleTogglePermission(permission)}
                                        className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] disabled:cursor-not-allowed"
                                        aria-label={`${checked ? 'Remove' : 'Assign'} ${permission.display_name || permission.name}`}
                                      />
                                      {updating && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--muted)]" />}
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-20 border border-dashed border-[var(--muted-border)] rounded-lg bg-[var(--card-bg)] text-[var(--muted)]">
                <Key className="w-8 h-8 mx-auto opacity-50 mb-3" />
                <span className="text-xs font-semibold">Select a role to inspect its permissions.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateRole}
            className="w-full max-w-md glass-panel rounded-lg p-6 shadow-2xl border border-[var(--muted-border)] bg-[var(--card-bg)] animate-in zoom-in-95 duration-200 space-y-4"
          >
            <div className="flex justify-between items-start pb-4 border-b border-[var(--muted-border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Create Custom Role</h3>
                <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Custom roles start without permissions.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(false)}
                className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 rounded-lg transition-colors"
                aria-label="Close create role dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]" htmlFor="role-display-name">Display Name</label>
                <input
                  id="role-display-name"
                  type="text"
                  value={newRoleDisplayName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNewRoleDisplayName(value);
                    if (!isRoleNameManuallyEdited) {
                      setNewRoleName(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''));
                    }
                    clearFieldError('newRoleDisplayName');
                  }}
                  placeholder="Senior Reviewer"
                  className={`w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)] ${
                    validationErrors.newRoleDisplayName ? 'border-red-500 focus:border-red-500' : 'border-[var(--muted-border)]'
                  }`}
                />
                {validationErrors.newRoleDisplayName && (
                  <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.newRoleDisplayName}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]" htmlFor="role-name">Role Identifier</label>
                <input
                  id="role-name"
                  type="text"
                  value={newRoleName}
                  onChange={(event) => {
                    const formatted = event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
                    setNewRoleName(formatted);
                    setIsRoleNameManuallyEdited(formatted !== '');
                    clearFieldError('newRoleName');
                  }}
                  placeholder="senior-reviewer"
                  className={`w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)] ${
                    validationErrors.newRoleName ? 'border-red-500 focus:border-red-500' : 'border-[var(--muted-border)]'
                  }`}
                />
                {validationErrors.newRoleName && (
                  <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.newRoleName}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]" htmlFor="role-description">Description</label>
                <textarea
                  id="role-description"
                  value={newRoleDescription}
                  onChange={(event) => {
                    setNewRoleDescription(event.target.value);
                    clearFieldError('newRoleDescription');
                  }}
                  rows={3}
                  placeholder="Optional role purpose"
                  className={`w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)] resize-none ${
                    validationErrors.newRoleDescription ? 'border-red-500 focus:border-red-500' : 'border-[var(--muted-border)]'
                  }`}
                />
                {validationErrors.newRoleDescription && (
                  <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.newRoleDescription}</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--muted-border)] flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateRoleModal(false)}
                className="text-xs border border-[var(--muted-border)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={creatingRole}
                className="text-xs gap-1.5"
              >
                {creatingRole ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{creatingRole ? 'Creating...' : 'Create Role'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Delete Role?"
        message={`Are you sure you want to permanently delete the role "${deleteRoleName}"? This action cannot be undone.`}
        confirmText="Delete Role"
        cancelText="Cancel"
        onConfirm={executeDeleteRole}
        onCancel={() => {
          setIsConfirmOpen(false);
          setDeleteRoleId(null);
          setDeleteRoleName('');
        }}
        variant="danger"
        isLoading={deletingRole}
      />
    </div>
  );
}
