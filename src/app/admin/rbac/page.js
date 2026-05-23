'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../utils/api';
import {
  ShieldAlert, Users, Lock, Key, ShieldCheck,
  Settings, UserCheck, RefreshCw, Save, CheckCircle,
  Plus, Trash2, Shield, Info, HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export default function RbacManager() {
  const { user: authUser, hasRole, hasPermission, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'matrix' | 'settings'

  // Data states
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [defaultRoleName, setDefaultRoleName] = useState('author');

  // Modal / Editing states
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserRoleId, setSelectedUserRoleId] = useState('');

  // Create User states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRoleId, setNewUserRoleId] = useState('');

  // Create Role states
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');

  // Fetch all RBAC records from the backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permissionsRes, settingsRes] = await Promise.all([
        api.get('/admin/rbac/users'),
        api.get('/admin/rbac/roles'),
        api.get('/admin/rbac/permissions'),
        api.get('/admin/rbac/settings/registration-role')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setPermissions(permissionsRes.data);

      const defRole = settingsRes.data?.default_registration_role || 'author';
      setDefaultRoleName(defRole);

      // Preserve or set selected role
      if (rolesRes.data.length > 0) {
        setSelectedRole(prev => {
          const current = rolesRes.data.find(r => r.id === prev?.id);
          return current || rolesRes.data[0];
        });
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load access control records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (hasRole('super_admin') || hasPermission('roles.view-any'))) {
      fetchData();
    }
  }, [authLoading]);

  // Update user role (Single role PATCH)
  const handleOpenUserModal = (user) => {
    setEditingUser(user);
    setSelectedUserRoleId(user.role_id || '');
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/admin/rbac/users/${editingUser.id}/role`, {
        role_id: Number(selectedUserRoleId)
      });
      toast(`Access privileges updated for ${editingUser.name}.`, 'success');

      // Update local state
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, role_id: res.data.role_id, role: res.data.role, roles: res.data.roles } : u));
      setEditingUser(null);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update user role.';
      toast(errMsg, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Create custom Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleDisplayName.trim()) {
      toast('All role fields are required.', 'error');
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
      await fetchData();
      // Select the newly created role
      const newRole = roles.find(r => r.name === res.data.name) || res.data;
      setSelectedRole(newRole);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create role.';
      toast(errMsg, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Delete custom Role
  const handleDeleteRole = async (roleId, roleName) => {
    if (!confirm(`Are you sure you want to permanently delete the role "${roleName}"?`)) {
      return;
    }
    setUpdating(true);
    try {
      await api.delete(`/admin/rbac/roles/${roleId}`);
      toast(`Role "${roleName}" deleted successfully.`, 'success');
      await fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to delete role.';
      toast(errMsg, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Sync Permissions Helper
  const syncRolePermissions = async (roleId, targetPermissions) => {
    try {
      const res = await api.post(`/admin/rbac/roles/${roleId}/permissions`, {
        permissions: targetPermissions
      });
      // Update local state
      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions: res.data.permissions } : r));
      setSelectedRole(prev => prev.id === roleId ? { ...prev, permissions: res.data.permissions } : prev);
      toast('Permissions updated successfully.', 'success');
    } catch (err) {
      toast('Failed to update permissions.', 'error');
    }
  };

  // Toggle boolean checkbox permission
  const handleToggleCheckboxPermission = (permissionName, allowed) => {
    if (!selectedRole) return;
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
    let targetPermissions = selectedRole.permissions.map(p => p.name);

    // Filter out existing scope permissions for this resource
    const ownPerm = `${resourceName}.view-own`;
    const anyPerm = `${resourceName}.view-any`;
    const editOwnPerm = `${resourceName}.edit-own`;
    const editAnyPerm = `${resourceName}.edit-any`;
    const deleteOwnPerm = `${resourceName}.delete-own`;
    const deleteAnyPerm = `${resourceName}.delete-any`;

    const cleanList = [ownPerm, anyPerm, editOwnPerm, editAnyPerm, deleteOwnPerm, deleteAnyPerm];
    targetPermissions = targetPermissions.filter(p => !cleanList.includes(p));

    if (scope === 'own') {
      targetPermissions.push(ownPerm, editOwnPerm, deleteOwnPerm);
    } else if (scope === 'any') {
      targetPermissions.push(anyPerm, editAnyPerm, deleteAnyPerm);
    } // 'none' leaves them empty

    syncRolePermissions(selectedRole.id, targetPermissions);
  };

  // Create User Handler (assign single role_id)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast('Name and email are required.', 'error');
      return;
    }
    if (!newUserRoleId) {
      toast('Please assign a default role to the user.', 'error');
      return;
    }
    setUpdating(true);
    try {
      await api.post('/admin/rbac/users', {
        name: newUserName,
        email: newUserEmail,
        role_id: Number(newUserRoleId)
      });
      toast(`User ${newUserName} created successfully. Welcome credentials email dispatched.`, 'success');
      setShowCreateModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRoleId('');
      await fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create user.';
      toast(errMsg, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Update default registration setting
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

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Authenticating Privileges...</span>
      </div>
    );
  }

  if (!hasRole('super_admin') && !hasPermission('roles.view-any')) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Access Restricted</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You must possess administrative privileges to view and configure team access controls.
          </p>
        </div>
      </div>
    );
  }

  // Get scope helper values for view, edit, delete
  const getResourceScope = (resourceName) => {
    if (!selectedRole) return 'none';
    const names = selectedRole.permissions.map(p => p.name);
    if (names.includes(`${resourceName}.view-any`)) return 'any';
    if (names.includes(`${resourceName}.view-own`)) return 'own';
    return 'none';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <title>Role Management - ScholarlyNest</title>

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Access Control Console
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
            <span>Refresh Workspace</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs py-2 h-auto cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New User</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-[var(--muted-border)] pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${activeTab === 'users' ? 'border-[var(--accent-gold)] text-[var(--foreground)] font-bold' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${activeTab === 'matrix' ? 'border-[var(--accent-gold)] text-[var(--foreground)] font-bold' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          Roles & Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${activeTab === 'settings' ? 'border-[var(--accent-gold)] text-[var(--foreground)] font-bold' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`}
        >
          Registration Settings
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Querying RBAC Records...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: USER ACCOUNTS TABLE */}
          {activeTab === 'users' && (
            <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[var(--muted)]" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">System User Directory</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Inspect active personnel accounts and update their single system access role.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[var(--muted-border)] bg-black/5 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">Assigned Role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--muted-border)]/50 text-xs">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-[var(--foreground)]/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-[var(--foreground)] flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-[var(--muted)]">{u.email}</td>
                        <td className="px-6 py-4">
                          <Badge variant={u.role?.name === 'super_admin' ? 'gold' : u.role?.name === 'editor' ? 'default' : 'outline'}>
                            {u.role?.display_name || 'No Role Assigned'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenUserModal(u)}
                            className="text-xs py-1.5 h-auto hover:bg-[var(--foreground)]/10 text-[var(--accent)] dark:text-blue-400 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1 inline" />
                            Reassign Role
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: ROLES & PERMISSIONS SPLIT-PANE MATRIX */}
          {activeTab === 'matrix' && (
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
                      <Plus className="w-3 h-3" />
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
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${isSelected ? 'bg-[var(--accent)] text-white shadow-sm font-bold' : 'hover:bg-[var(--foreground)]/5 text-[var(--muted)] hover:text-[var(--foreground)]'}`}
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
                                className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
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
                    <CardHeader className="border-b border-[var(--muted-border)]/50 pb-4">
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

                    {selectedRole.name === 'super_admin' ? (
                      <CardContent className="py-12 text-center space-y-3">
                        <Lock className="w-12 h-12 text-[var(--accent-gold)] mx-auto" />
                        <h4 className="text-sm font-bold text-[var(--foreground)]">Absolute Override Layer Enabled</h4>
                        <p className="text-xs text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
                          The Super Administrator possesses dynamic bypasses for all security check middleware. Permissions cannot be modified for this default role.
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
                                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${active ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--muted-border)] text-[var(--muted)] hover:bg-[var(--foreground)]/5'}`}
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
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Allow Submitting new Articles</span>
                                </label>

                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'articles.approve')}
                                    onChange={(e) => handleToggleCheckboxPermission('articles.approve', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Allow Approving / Reviewing Articles</span>
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
                                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${active ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--muted-border)] text-[var(--muted)] hover:bg-[var(--foreground)]/5'}`}
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
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Allow Creating new Magazines</span>
                                </label>

                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'magazines.edit')}
                                    onChange={(e) => handleToggleCheckboxPermission('magazines.edit', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Allow Modifying Magazine Settings & Pages</span>
                                </label>

                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'magazines.delete')}
                                    onChange={(e) => handleToggleCheckboxPermission('magazines.delete', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Allow Deleting Magazines</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* General System Config Group */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-[var(--muted-border)]/30">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Security & Directory Systems</h4>
                            <span className="text-[10px] text-[var(--muted)] font-medium">Administration Modules</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

                            <div className="space-y-3">
                              <label className="text-[11px] font-bold text-[var(--foreground)] block">Access Control (RBAC)</label>
                              <div className="space-y-2">
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'roles.view-any')}
                                    onChange={(e) => handleToggleCheckboxPermission('roles.view-any', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">View Roles</span>
                                </label>
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'roles.manage')}
                                    onChange={(e) => handleToggleCheckboxPermission('roles.manage', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
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
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">View Users</span>
                                </label>
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'users.create')}
                                    onChange={(e) => handleToggleCheckboxPermission('users.create', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Create Users</span>
                                </label>
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'users.manage')}
                                    onChange={(e) => handleToggleCheckboxPermission('users.manage', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
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
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">View Settings</span>
                                </label>
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'settings.manage')}
                                    onChange={(e) => handleToggleCheckboxPermission('settings.manage', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Manage Settings</span>
                                </label>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[11px] font-bold text-[var(--foreground)] block">Newsletter System</label>
                              <div className="space-y-2">
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'newsletters.view-any')}
                                    onChange={(e) => handleToggleCheckboxPermission('newsletters.view-any', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">View Campaigns</span>
                                </label>
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'newsletters.create')}
                                    onChange={(e) => handleToggleCheckboxPermission('newsletters.create', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Create Campaigns</span>
                                </label>
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'newsletters.send')}
                                    onChange={(e) => handleToggleCheckboxPermission('newsletters.send', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Send Campaigns</span>
                                </label>
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRole.permissions.some(p => p.name === 'newsletters.delete')}
                                    onChange={(e) => handleToggleCheckboxPermission('newsletters.delete', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                                  />
                                  <span className="text-xs font-semibold text-[var(--foreground)]">Delete Campaigns</span>
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
                    <span className="text-xs font-semibold">Select a role from the sidebar to edit its dynamic permission parameters.</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: REGISTRATION SETTINGS */}
          {activeTab === 'settings' && (
            <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md max-w-2xl">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-[var(--muted)]" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">Global Registration Properties</CardTitle>
                </div>
                <CardDescription className="text-xs">
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
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Default Registration Role</label>
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
        </>
      )}

      {/* USER ROLE EDITOR MODAL (Single role PATCH selection) */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl border border-[var(--muted-border)] bg-[var(--card-bg)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start pb-4 border-b border-[var(--muted-border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Reassign User Role</h3>
                <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Reassign access level for account: {editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] block">Select Role Allocation</span>
              <div className="space-y-3">
                {roles.map(r => {
                  const isChecked = Number(selectedUserRoleId) === r.id;
                  return (
                    <label
                      key={r.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isChecked ? 'bg-[var(--accent)]/5 border-[var(--accent)]/50' : 'border-[var(--muted-border)] hover:bg-[var(--foreground)]/5'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="user_role"
                          checked={isChecked}
                          onChange={() => setSelectedUserRoleId(r.id)}
                          className="w-4 h-4 rounded-full border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-[var(--foreground)] block">{r.display_name}</span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">{r.name}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--muted-border)] flex items-center justify-end space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingUser(null)}
                className="text-xs border border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveUserRole}
                disabled={updating}
                className="text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{updating ? 'Updating...' : 'Save Privileges'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL (Single role dropdown selection) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateUser}
            className="w-full max-w-md glass-panel rounded-2xl p-6 shadow-2xl border border-[var(--muted-border)] bg-[var(--card-bg)] animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start pb-4 border-b border-[var(--muted-border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Create New User</h3>
                <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Create a verified account without a password. Welcome login link email will be dispatched.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Academic Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="johndoe@university.edu"
                  className="w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] block">Assign Role</label>
                <select
                  value={newUserRoleId}
                  onChange={(e) => setNewUserRoleId(e.target.value)}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-md focus:outline-none text-[var(--foreground)] cursor-pointer"
                >
                  <option value="">Select access level...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.display_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--muted-border)] flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
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
                <Save className="w-3.5 h-3.5" />
                <span>{updating ? 'Creating...' : 'Create Account'}</span>
              </Button>
            </div>
          </form>
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
                  required
                  value={newRoleDisplayName}
                  onChange={(e) => {
                    setNewRoleDisplayName(e.target.value);
                    if (!newRoleName) {
                      setNewRoleName(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  placeholder="Senior Reviewer"
                  className="w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Role Identifier</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="senior-reviewer"
                  className="w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)]"
                />
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

    </div>
  );
}
