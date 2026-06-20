'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import { useRouter } from 'next/navigation';
import { safeApiMessage } from '../../../../utils/safeErrors';
import { logError } from '../../../../utils/safeLogger';
import {
  ShieldAlert, Lock, Key, RefreshCw, Plus, Trash2, Shield, Info, HelpCircle, Loader2, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';

export default function RolesPermissionsPage() {
  const { user: authUser, hasRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isSuperAdmin = authUser && hasRole('super_admin');

  // Data states
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Create Role states
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [isRoleNameManuallyEdited, setIsRoleNameManuallyEdited] = useState(false);
  
  // Confirmation modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState(null);
  const [deleteRoleName, setDeleteRoleName] = useState('');

  const [validationErrors, setValidationErrors] = useState({});

  const fetchData = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get('/admin/rbac/roles'),
        api.get('/admin/rbac/permissions')
      ]);
      setRoles(rolesRes.data || []);
      setPermissions(permissionsRes.data || []);

      if (rolesRes.data && rolesRes.data.length > 0) {
        setSelectedRole(prev => {
          const current = rolesRes.data.find(r => r.id === prev?.id);
          return current || rolesRes.data[0];
        });
      }
    } catch (err) {
      logError(err);
      toast('Failed to load roles and permissions.', 'error');
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

  useEffect(() => {
    setValidationErrors({});
    if (!showCreateRoleModal) {
      setIsRoleNameManuallyEdited(false);
    }
  }, [showCreateRoleModal]);

  // Create custom Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    const errors = {};
    if (!newRoleDisplayName.trim()) {
      errors.newRoleDisplayName = 'Role Display Name is required.';
    }
    if (!newRoleName.trim()) {
      errors.newRoleName = 'Role Identifier is required.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setUpdating(true);
    try {
      const res = await api.post('/admin/rbac/roles', {
        name: newRoleName,
        display_name: newRoleDisplayName
      });
      toast(`Role "${newRoleDisplayName}" created. Assign permissions in the matrix pane.`, 'success');
      setNewRoleName('');
      setNewRoleDisplayName('');
      setShowCreateRoleModal(false);
      
      // Reload and select new role
      const rolesRes = await api.get('/admin/rbac/roles');
      const updatedRoles = rolesRes.data || [];
      setRoles(updatedRoles);
      const newRole = updatedRoles.find(r => r.name === res.data.name) || res.data;
      setSelectedRole(newRole);
    } catch (err) {
      const errMsg = safeApiMessage(err, 'Failed to create role.');
      toast(errMsg, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Delete custom Role Trigger
  const handleDeleteRole = (roleId, roleName) => {
    setDeleteRoleId(roleId);
    setDeleteRoleName(roleName);
    setIsConfirmOpen(true);
  };

  const executeDeleteRole = async () => {
    if (!deleteRoleId) return;
    setUpdating(true);
    try {
      await api.delete(`/admin/rbac/roles/${deleteRoleId}`);
      toast(`Role "${deleteRoleName}" deleted successfully.`, 'success');
      
      // Reload roles list
      const rolesRes = await api.get('/admin/rbac/roles');
      const updatedRoles = rolesRes.data || [];
      setRoles(updatedRoles);
      if (updatedRoles.length > 0) {
        setSelectedRole(updatedRoles[0]);
      } else {
        setSelectedRole(null);
      }
    } catch (err) {
      const errMsg = safeApiMessage(err, 'Failed to delete role.');
      toast(errMsg, 'error');
    } finally {
      setUpdating(false);
      setIsConfirmOpen(false);
      setDeleteRoleId(null);
      setDeleteRoleName('');
    }
  };

  // Sync Permissions Helper
  const syncRolePermissions = async (roleId, targetPermissions) => {
    try {
      const res = await api.post(`/admin/rbac/roles/${roleId}/permissions`, {
        permissions: targetPermissions
      });
      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions: res.data.permissions } : r));
      setSelectedRole(prev => prev.id === roleId ? { ...prev, permissions: res.data.permissions } : prev);
      toast('Permissions updated successfully.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Failed to update permissions.'), 'error');
    }
  };

  // Toggle boolean checkbox permission
  const handleToggleCheckboxPermission = (permissionName, allowed) => {
    if (!selectedRole) return;
    if (selectedRole.is_system) {
      toast('System role permissions cannot be changed.', 'error');
      return;
    }
    let targetPermissions = selectedRole.permissions.map(p => p.name);
    if (allowed) {
      if (!targetPermissions.includes(permissionName)) {
        targetPermissions.push(permissionName);
      }
    } else {
      targetPermissions = targetPermissions.filter(name => name !== permissionName);
    }
    syncRolePermissions(selectedRole.id, targetPermissions);
  };

  // Toggle ownership scope permission (None / Own / All)
  const handleScopeChange = (resourceName, scope) => {
    if (!selectedRole) return;
    if (selectedRole.is_system) {
      toast('System role permissions cannot be changed.', 'error');
      return;
    }
    let targetPermissions = selectedRole.permissions.map(p => p.name);

    const ownPerm = `${resourceName}.view-own`;
    const anyPerm = `${resourceName}.view-any`;
    const editOwnPerm = `${resourceName}.edit-own`;
    const editAnyPerm = `${resourceName}.edit-any`;
    const cleanList = [ownPerm, anyPerm, editOwnPerm, editAnyPerm];
    targetPermissions = targetPermissions.filter(p => !cleanList.includes(p));

    if (scope === 'own') {
      targetPermissions.push(ownPerm, editOwnPerm);
    } else if (scope === 'any') {
      targetPermissions.push(anyPerm, editAnyPerm);
    }

    syncRolePermissions(selectedRole.id, targetPermissions);
  };

  const getResourceScope = (resourceName) => {
    if (!selectedRole) return 'none';
    const names = selectedRole.permissions.map(p => p.name);
    if (names.includes(`${resourceName}.view-any`)) return 'any';
    if (names.includes(`${resourceName}.view-own`)) return 'own';
    return 'none';
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
      <title>Roles & Permission Matrix - ScholarlyNest</title>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Roles & Permission Matrix
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5 font-medium max-w-2xl">
            Configure system permissions, administer roles, and customize default registration properties inside our unified security workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 text-xs py-2 h-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Querying RBAC Records...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT PANE: Roles List */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">System Roles</CardTitle>
                  <CardDescription className="text-[10px]">Select a role to inspect permissions</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateRoleModal(true)}
                  className="text-[10px] py-1 px-2.5 h-auto border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 flex items-center gap-1 cursor-pointer font-bold uppercase tracking-widest"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom
                </Button>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {roles.map(r => {
                  const isSelected = selectedRole?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRole(r)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white shadow-sm font-bold'
                          : 'hover:bg-[var(--foreground)]/5 text-[var(--muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Shield className={`w-4 h-4 ${isSelected ? 'text-[var(--accent-gold)]' : 'text-[var(--muted)]'}`} />
                        <div className="text-left">
                          <span className="text-xs block font-bold">{r.display_name}</span>
                          <span className={`text-[9px] block ${isSelected ? 'text-zinc-200' : 'text-zinc-400'}`}>{r.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={r.is_system ? 'default' : 'outline'} className={isSelected ? 'bg-white/20 border-white/20 text-white' : ''}>
                          {r.is_system ? 'System' : 'Custom'}
                        </Badge>
                        {!r.is_system && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(r.id, r.display_name);
                            }}
                            className="p-1 rounded text-red-400 hover:text-red-650 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT PANE: Permissions Configuration Grid */}
          <div className="lg:col-span-8">
            {selectedRole ? (
              <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md">
                <CardHeader className="border-b border-[var(--muted-border)]/55 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-[var(--foreground)]">
                        Permissions Matrix: {selectedRole.display_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Define resource access rules and ownership boundaries for this security layer.
                      </CardDescription>
                    </div>
                    <Badge variant={selectedRole.name === 'super_admin' ? 'gold' : 'default'} className="uppercase tracking-widest text-[9px] font-bold">
                      {selectedRole.name}
                    </Badge>
                  </div>
                </CardHeader>

                {selectedRole.is_system ? (
                  <CardContent className="py-12 text-center space-y-3">
                    <Lock className="w-12 h-12 text-[var(--accent-gold)] mx-auto" />
                    <h4 className="text-sm font-bold text-[var(--foreground)]">System Role Locked</h4>
                    <p className="text-xs text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
                      This role is part of the manuscript workflow baseline. Its name, label, and permission set are managed by the platform and cannot be modified here.
                    </p>
                  </CardContent>
                ) : (
                  <CardContent className="p-6 space-y-8">
                    {/* Scope Config Group: Articles */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--muted-border)]/30">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Articles Management</h4>
                        <span className="text-[10px] text-[var(--muted)] font-medium">Ownership-Aware Scopes</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-[var(--foreground)] block">Articles Permissions Scope</label>
                          <div className="flex flex-wrap gap-2">
                            {['none', 'own', 'any'].map((sc) => {
                              const active = getResourceScope('articles') === sc;
                              return (
                                <button
                                  key={sc}
                                  onClick={() => handleScopeChange('articles', sc)}
                                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                    active
                                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                                      : 'border-[var(--muted-border)] text-[var(--muted)] hover:bg-[var(--foreground)]/5'
                                  }`}
                                >
                                  {sc === 'none' ? 'No Access' : sc === 'own' ? 'Own Records' : 'All Records'}
                                </button>
                              );
                            })}
                          </div>
                          <span className="text-[9px] text-[var(--muted)] block">Configure view, edit, and delete limits for articles.</span>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-[var(--foreground)] block">Administrative Capabilities</label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'articles.create')}
                                onChange={(e) => handleToggleCheckboxPermission('articles.create', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Allow Submitting new Articles</span>
                            </label>

                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'articles.approve')}
                                onChange={(e) => handleToggleCheckboxPermission('articles.approve', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Allow Approving / Reviewing Articles</span>
                            </label>

                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'articles.auto-approve')}
                                onChange={(e) => handleToggleCheckboxPermission('articles.auto-approve', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Auto-Accept & Compile PDF</span>
                            </label>

                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'articles.manage-assets')}
                                onChange={(e) => handleToggleCheckboxPermission('articles.manage-assets', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Manage Supplementary Assets</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scope Config Group: Magazines */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--muted-border)]/30">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Magazines Management</h4>
                        <span className="text-[10px] text-[var(--muted)] font-medium">Volume & Page Configurations</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-[var(--foreground)] block">Magazines Permissions Scope</label>
                          <div className="flex flex-wrap gap-2">
                            {['none', 'own', 'any'].map((sc) => {
                              const active = getResourceScope('magazines') === sc;
                              return (
                                <button
                                  key={sc}
                                  onClick={() => handleScopeChange('magazines', sc)}
                                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                    active
                                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                                      : 'border-[var(--muted-border)] text-[var(--muted)] hover:bg-[var(--foreground)]/5'
                                  }`}
                                >
                                  {sc === 'none' ? 'No Access' : sc === 'own' ? 'Own Volumes' : 'All Volumes'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-[var(--foreground)] block">Administrative Capabilities</label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'magazines.create')}
                                onChange={(e) => handleToggleCheckboxPermission('magazines.create', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Allow Creating new Magazines</span>
                            </label>

                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'magazines.edit')}
                                onChange={(e) => handleToggleCheckboxPermission('magazines.edit', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Allow Modifying Magazine Settings & Pages</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEO Settings Group */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--muted-border)]/30">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Search Engine Optimization (SEO)</h4>
                        <span className="text-[10px] text-[var(--muted)] font-medium">SEO Parameters</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-[var(--foreground)] block">Metadata Management</label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'seo.articles')}
                                onChange={(e) => handleToggleCheckboxPermission('seo.articles', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Manage Article SEO</span>
                            </label>

                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'seo.magazines')}
                                onChange={(e) => handleToggleCheckboxPermission('seo.magazines', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Manage Magazine SEO</span>
                            </label>

                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'seo.cms-pages')}
                                onChange={(e) => handleToggleCheckboxPermission('seo.cms-pages', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Manage CMS Page SEO</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Directory System Capabilities */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--muted-border)]/30">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Security & Directory Systems</h4>
                        <span className="text-[10px] text-[var(--muted)] font-medium">Administration Modules</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-[var(--foreground)] block">Access Control (RBAC)</label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'roles.view-any')}
                                onChange={(e) => handleToggleCheckboxPermission('roles.view-any', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">View Roles</span>
                            </label>
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'roles.manage')}
                                onChange={(e) => handleToggleCheckboxPermission('roles.manage', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Manage Roles</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-[var(--foreground)] block">User Administration</label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'users.view-any')}
                                onChange={(e) => handleToggleCheckboxPermission('users.view-any', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">View Users</span>
                            </label>
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'users.create')}
                                onChange={(e) => handleToggleCheckboxPermission('users.create', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Create Users</span>
                            </label>
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'users.manage')}
                                onChange={(e) => handleToggleCheckboxPermission('users.manage', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Manage Roles Matrix</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-bold text-[var(--foreground)] block">System Settings</label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'settings.view-any')}
                                onChange={(e) => handleToggleCheckboxPermission('settings.view-any', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">View Settings</span>
                            </label>
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRole.permissions.some(p => p.name === 'settings.manage')}
                                onChange={(e) => handleToggleCheckboxPermission('settings.manage', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-[var(--foreground)]">Manage Settings</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ) : (
              <div className="text-center py-20 border border-dashed border-[var(--muted-border)] rounded-2xl bg-[var(--card-bg)] text-[var(--muted)]">
                <Key className="w-8 h-8 mx-auto opacity-50 mb-3" />
                <span className="text-xs font-semibold">Select a role from the list to edit its permission matrix.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE ROLE MODAL */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateRole}
            className="w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl border border-[var(--muted-border)] bg-[var(--card-bg)] animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start pb-4 border-b border-[var(--muted-border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Create Custom Role</h3>
                <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Create a new organizational role with customizable permission bindings.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(false)}
                className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Role Display Name</label>
                <input
                  type="text"
                  value={newRoleDisplayName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewRoleDisplayName(val);
                    if (!isRoleNameManuallyEdited) {
                      setNewRoleName(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''));
                    }
                    if (validationErrors.newRoleDisplayName) {
                      setValidationErrors(prev => {
                        const copy = { ...prev };
                        delete copy.newRoleDisplayName;
                        return copy;
                      });
                    }
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Role Identifier</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const formatted = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
                    setNewRoleName(formatted);
                    if (formatted === '') {
                      setIsRoleNameManuallyEdited(false);
                    } else {
                      setIsRoleNameManuallyEdited(true);
                    }
                    if (validationErrors.newRoleName) {
                      setValidationErrors(prev => {
                        const copy = { ...prev };
                        delete copy.newRoleName;
                        return copy;
                      });
                    }
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
            </div>

            <div className="pt-4 border-t border-[var(--muted-border)] flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateRoleModal(false)}
                className="text-xs border border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={updating}
                className="text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{updating ? 'Creating...' : 'Create Role'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
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
        isLoading={updating}
      />
    </div>
  );
}
