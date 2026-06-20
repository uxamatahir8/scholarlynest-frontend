'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlus, ArrowLeft, Loader2, AlertTriangle, ShieldAlert, ChevronDown, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';

export default function CreateUserPage() {
  const { user: authUser, hasRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Privilege Guard
  const isSuperAdmin = authUser && hasRole('super_admin');

  // Static/Fetched Selection Data
  const [roles, setRoles] = useState([]);
  const [editors, setEditors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [selectedEditorIds, setSelectedEditorIds] = useState([]);

  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  // Searchable Multi-Select States
  const [editorSearchQuery, setEditorSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  // Determine if Sub Editor is selected
  const selectedRole = roles.find(r => r.id === parseInt(roleId));
  const isSubEditor = selectedRole && (selectedRole.name === 'sub_editor' || selectedRole.name === 'sub-editor');

  // Load Roles and Editors
  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      const loadOptions = async () => {
        setLoadingOptions(true);
        try {
          // Fetch roles
          const rolesRes = await api.get('/admin/rbac/roles');
          setRoles(rolesRes.data || []);

          // Fetch active editors
          const editorsRes = await api.get('/admin/users', { params: { role: 'editor' } });
          setEditors(editorsRes.data || []);
        } catch (err) {
          toast('Failed to load role or editor selection lists.', 'error');
        } finally {
          setLoadingOptions(false);
        }
      };

      loadOptions();
    }
  }, [authLoading, isSuperAdmin]);

  // Auth Protection Redirect
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/admin');
    }
  }, [authLoading, isSuperAdmin]);

  // Clear stale editor selections if role changes from sub_editor
  useEffect(() => {
    if (!isSubEditor) {
      setSelectedEditorIds([]);
      setEditorSearchQuery('');
      setDropdownOpen(false);
    }
  }, [roleId, isSubEditor]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle Editor Selection Toggle
  const handleEditorToggle = (editorId) => {
    setSelectedEditorIds(prev => {
      if (prev.includes(editorId)) {
        return prev.filter(id => id !== editorId);
      } else {
        return [...prev, editorId];
      }
    });
  };

  // Filter editors by search query and exclude already selected
  const filteredEditors = editors.filter(editor => {
    if (selectedEditorIds.includes(editor.id)) return false;
    const query = editorSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      editor.name.toLowerCase().includes(query) ||
      editor.email.toLowerCase().includes(query)
    );
  });

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setFieldErrors({});
    setGeneralError(null);

    // Front-end Validations
    const errors = {};
    if (!name.trim()) errors.name = 'Name is required.';
    if (!email.trim()) errors.email = 'Email address is required.';
    if (!roleId) errors.role_id = 'A role assignment is required.';
    if (!password) errors.password = 'Password is required.';
    if (password !== confirmPassword) {
      errors.confirm_password = 'Password confirmation does not match.';
    }

    if (isSubEditor && selectedEditorIds.length === 0) {
      errors.editor_ids = 'At least one Editor must be assigned to a Sub Editor.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast('Please review the form for validation errors.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        role_id: parseInt(roleId),
        university_name: universityName || null,
        status: 'active',
      };

      if (isSubEditor) {
        payload.editor_ids = selectedEditorIds;
      }

      await api.post('/admin/users', payload);

      toast('User account created successfully.', 'success');
      
      // Clear password values for safety
      setPassword('');
      setConfirmPassword('');

      // Redirect to directory
      router.push('/admin/users');
    } catch (err) {
      const response = err.response;
      if (response && response.status === 422) {
        const backendErrors = response.data?.errors || {};
        const formattedErrors = {};
        Object.keys(backendErrors).forEach(key => {
          formattedErrors[key] = backendErrors[key][0];
        });
        setFieldErrors(formattedErrors);
        toast('Account creation validation failed.', 'error');
      } else {
        setGeneralError('We encountered an error trying to create this account. Please verify connectivity and try again.');
        toast('An unexpected error occurred during user creation.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (!isSuperAdmin && authUser) || loadingOptions) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Loading Creation Portal...</span>
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
            You must possess Super Admin privileges to access the user account creation portal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <title>Create User - ScholarlyNest</title>

      <div className="flex items-center space-x-4">
        <Link href="/admin/users" passHref legacyBehavior>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 text-xs py-2 h-auto cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Accounts</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Create User
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5 font-medium">
            Register a new platform personnel account and assign their workflow access privileges.
          </p>
        </div>
      </div>

      <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md">
        <CardHeader className="border-b border-[var(--muted-border)]/50 pb-4">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">Personnel Information</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Provide the required details to initialize the new platform profile.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {generalError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start space-x-3 text-xs text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-[var(--foreground)] ${
                    fieldErrors.name ? 'border-red-500' : 'border-[var(--muted-border)]'
                  }`}
                  placeholder="e.g. John Doe"
                />
                {fieldErrors.name && (
                  <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-[var(--foreground)] ${
                    fieldErrors.email ? 'border-red-500' : 'border-red-500'
                  }`}
                  placeholder="e.g. john.doe@example.com"
                />
                {fieldErrors.email && (
                  <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{fieldErrors.email}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Access Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className={`w-full text-xs font-semibold px-3 py-2 bg-[var(--card-bg)] border rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-[var(--foreground)] ${
                    fieldErrors.role_id ? 'border-red-500' : 'border-[var(--muted-border)]'
                  }`}
                >
                  <option value="">Select a system role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.display_name}
                    </option>
                  ))}
                </select>
                {fieldErrors.role_id && (
                  <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{fieldErrors.role_id}</p>
                )}
              </div>

              {/* University/Organization */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">University / Organization</label>
                <input
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-[var(--foreground)]"
                  placeholder="e.g. Oxford University (Optional)"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-[var(--foreground)] ${
                    fieldErrors.password ? 'border-red-500' : 'border-[var(--muted-border)]'
                  }`}
                  placeholder="••••••••"
                />
                {fieldErrors.password && (
                  <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-[var(--foreground)] ${
                    fieldErrors.confirm_password ? 'border-red-500' : 'border-[var(--muted-border)]'
                  }`}
                  placeholder="••••••••"
                />
                {fieldErrors.confirm_password && (
                  <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{fieldErrors.confirm_password}</p>
                )}
              </div>
            </div>

            {/* Mandatory Sub Editor -> Editor Assignment Searchable Multi-Select */}
            {isSubEditor && (
              <div className="border border-[var(--muted-border)] rounded-xl p-4 bg-[var(--foreground)]/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Assigned Editor(s)</h3>
                  <p className="text-[10px] text-[var(--muted)] mt-1">
                    Sub Editors must be affiliated with at least one active Editor to manage their assigned submission workflows.
                  </p>
                </div>

                {editors.length === 0 ? (
                  <p className="text-xs text-amber-500 font-medium">
                    No active Editor profiles were found. Please configure a user with the Editor role before creating a Sub Editor.
                  </p>
                ) : (
                  <div className="space-y-3" ref={containerRef}>
                    {/* Searchable Combobox Container */}
                    <div className="relative">
                      <div
                        onClick={() => setDropdownOpen(true)}
                        className={`flex flex-wrap gap-1.5 p-2 bg-[var(--card-bg)] border rounded-xl min-h-[42px] items-center cursor-pointer justify-between ${
                          fieldErrors.editor_ids ? 'border-red-500' : 'border-[var(--muted-border)]'
                        }`}
                      >
                        <div className="flex flex-wrap gap-1.5 items-center flex-1">
                          {selectedEditorIds.length === 0 && (
                            <span className="text-zinc-400 text-xs px-2 select-none">Select editor(s)...</span>
                          )}
                          {selectedEditorIds.map(id => {
                            const editor = editors.find(e => e.id === id);
                            if (!editor) return null;
                            return (
                              <div
                                key={id}
                                className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider animate-in fade-in zoom-in-95"
                              >
                                <span>{editor.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditorToggle(id);
                                  }}
                                  className="hover:text-amber-800 dark:hover:text-white transition-colors cursor-pointer text-xs leading-none"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                      </div>

                      {/* Dropdown Options */}
                      {dropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-[var(--card-bg)] border border-[var(--muted-border)] rounded-xl shadow-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          {/* Search Input */}
                          <input
                            type="text"
                            placeholder="Search active editors by name or email..."
                            value={editorSearchQuery}
                            onChange={(e) => setEditorSearchQuery(e.target.value)}
                            className="w-full text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-lg focus:outline-none focus:border-amber-500 transition-colors text-[var(--foreground)]"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />

                          {/* Scrollable list */}
                          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                            {filteredEditors.length === 0 ? (
                              <div className="text-[10px] text-zinc-400 p-2 text-center select-none font-medium">
                                No matching editors available
                              </div>
                            ) : (
                              filteredEditors.map(editor => (
                                <button
                                  key={editor.id}
                                  type="button"
                                  onClick={() => {
                                    handleEditorToggle(editor.id);
                                    setEditorSearchQuery('');
                                  }}
                                  className="w-full text-left text-xs font-bold p-2 hover:bg-[var(--foreground)]/5 rounded-lg transition-colors flex flex-col cursor-pointer border border-transparent hover:border-[var(--muted-border)]/30"
                                >
                                  <span className="text-[var(--foreground)]">{editor.name}</span>
                                  <span className="text-[10px] text-zinc-400 font-medium">{editor.email}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {fieldErrors.editor_ids && (
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1">{fieldErrors.editor_ids}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--muted-border)]/50">
              <Link href="/admin/users" passHref legacyBehavior>
                <Button
                  variant="outline"
                  type="button"
                  disabled={submitting}
                  className="px-4 py-2 border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 text-xs cursor-pointer font-bold rounded-lg"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                variant="default"
                type="submit"
                disabled={submitting || (isSubEditor && editors.length === 0)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs cursor-pointer font-bold rounded-lg flex items-center space-x-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
