'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import api from '../../../../../utils/api';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { safeApiMessage } from '../../../../../utils/safeErrors';
import {
  ArrowLeft, Save, Loader2, UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import UserMagazineAssignment from '../../../../../components/admin/UserMagazineAssignment';

export default function EditUserPage() {
  const { user: authUser, hasRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const userId = params ? Number(params.id) : null;

  const isSuperAdmin = authUser && hasRole('super_admin');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [magazineIds, setMagazineIds] = useState([]);
  const [editorIds, setEditorIds] = useState([]);

  // Data states
  const [roles, setRoles] = useState([]);
  const [editorsList, setEditorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!authLoading) {
      if (!isSuperAdmin) {
        router.push('/admin');
      } else {
        const loadUserData = async () => {
          try {
            const [rolesRes, usersRes] = await Promise.all([
              api.get('/admin/rbac/roles'),
              api.get('/admin/rbac/users')
            ]);
            
            const rolesData = rolesRes.data || [];
            setRoles(rolesData);

            const allUsers = usersRes.data || [];
            
            // Find the specific user being edited
            const targetUser = allUsers.find(u => u.id === userId);
            if (!targetUser) {
              toast('User not found in system directory.', 'error');
              router.push('/admin/users');
              return;
            }

            setName(targetUser.name || '');
            setEmail(targetUser.email || '');
            setRoleId(targetUser.role_id || '');
            setUniversityName(targetUser.university_name || '');
            setMagazineIds(targetUser.magazines?.map(m => m.id) || []);
            setEditorIds(targetUser.assigned_editors?.map(e => e.id) || []);

            // Filter users who are editors
            const editors = allUsers.filter(u => {
              const rName = u.role?.name || '';
              return rName === 'editor' || rName === 'magazine-editor' || rName === 'magazine_editor';
            });
            setEditorsList(editors);

          } catch (err) {
            toast('Failed to load user editing context.', 'error');
          } finally {
            setLoading(false);
          }
        };
        loadUserData();
      }
    }
  }, [authLoading, isSuperAdmin, userId]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Name is required.';
    }
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'A valid email address is required.';
    }
    if (!roleId) {
      errors.roleId = 'Role assignment is required.';
    }
    if (!universityName.trim()) {
      errors.universityName = 'University or Institutional Affiliation is required.';
    }

    const selectedRoleObj = roles.find(r => r.id === Number(roleId));
    const isSubEditorSelected = selectedRoleObj && (selectedRoleObj.name === 'sub_editor' || selectedRoleObj.name === 'sub-editor');

    if (isSubEditorSelected && editorIds.length === 0) {
      errors.editorIds = 'At least one Editor must be assigned to a Sub Editor.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        role_id: Number(roleId),
        university_name: universityName,
        magazine_ids: magazineIds,
      };
      if (isSubEditorSelected) {
        payload.editor_ids = editorIds;
      }
      await api.patch(`/admin/rbac/users/${userId}`, payload);
      toast(`User account for ${name} successfully updated.`, 'success');
      router.push('/admin/users');
    } catch (err) {
      const errMsg = safeApiMessage(err, 'Failed to update user.');
      toast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-bold text-zinc-405 uppercase tracking-widest font-mono">Loading User Details...</span>
      </div>
    );
  }

  const selectedRoleObj = roles.find(r => r.id === Number(roleId));
  const isSubEditorSelected = selectedRoleObj && (selectedRoleObj.name === 'sub_editor' || selectedRoleObj.name === 'sub-editor');

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <title>Edit User - ScholarlyNest</title>

      <div className="flex items-center space-x-3">
        <Link href="/admin/users" passHref legacyBehavior>
          <Button
            variant="outline"
            size="sm"
            className="p-2 border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Edit User Profile
          </h1>
          <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">
            Update user information, academic affiliation, and system access role.
          </p>
        </div>
      </div>

      <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md">
        <CardContent className="p-6">
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) {
                    setValidationErrors(prev => {
                      const copy = { ...prev };
                      delete copy.name;
                      return copy;
                    });
                  }
                }}
                placeholder="John Doe"
                className={`w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)] ${
                  validationErrors.name ? 'border-red-500 focus:border-red-500' : 'border-[var(--muted-border)]'
                }`}
              />
              {validationErrors.name && (
                <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.name}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Academic Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors(prev => {
                      const copy = { ...prev };
                      delete copy.email;
                      return copy;
                    });
                  }
                }}
                placeholder="johndoe@university.edu"
                className={`w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)] ${
                  validationErrors.email ? 'border-red-500 focus:border-red-500' : 'border-[var(--muted-border)]'
                }`}
              />
              {validationErrors.email && (
                <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.email}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">University / Institutional Affiliation</label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => {
                  setUniversityName(e.target.value);
                  if (validationErrors.universityName) {
                    setValidationErrors(prev => {
                      const copy = { ...prev };
                      delete copy.universityName;
                      return copy;
                    });
                  }
                }}
                placeholder="Harvard University"
                className={`w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)] ${
                  validationErrors.universityName ? 'border-red-500 focus:border-red-500' : 'border-[var(--muted-border)]'
                }`}
              />
              {validationErrors.universityName && (
                <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.universityName}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] block">Assign Role</label>
              <select
                value={roleId}
                onChange={(e) => {
                  setRoleId(e.target.value);
                  setMagazineIds([]);
                  setEditorIds([]);
                  if (validationErrors.roleId) {
                    setValidationErrors(prev => {
                      const copy = { ...prev };
                      delete copy.roleId;
                      return copy;
                    });
                  }
                }}
                className={`w-full text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border rounded-md focus:outline-none text-[var(--foreground)] cursor-pointer ${
                  validationErrors.roleId ? 'border-red-500 focus:border-red-500' : 'border-[var(--muted-border)]'
                }`}
              >
                <option value="">Select access level...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.display_name}</option>
                ))}
              </select>
              {validationErrors.roleId && (
                <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.roleId}</span>
              )}
            </div>

            <UserMagazineAssignment
              selectedRoleId={roleId}
              roles={roles}
              value={magazineIds}
              onChange={setMagazineIds}
            />

            {isSubEditorSelected && (
              <div className="space-y-1.5">
                <EditorMultiSelect
                  selectedEditorIds={editorIds}
                  onChange={setEditorIds}
                  editorsList={editorsList}
                />
                {validationErrors.editorIds && (
                  <span className="text-red-500 text-[10px] font-bold mt-1 block">{validationErrors.editorIds}</span>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-[var(--muted-border)] flex items-center justify-end space-x-3">
              <Link href="/admin/users" passHref legacyBehavior>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs border border-[var(--muted-border)] hover:bg-[var(--foreground)]/5 cursor-pointer"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting}
                className="text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline EditorMultiSelect helper
function EditorMultiSelect({ selectedEditorIds, onChange, editorsList }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredEditors = editorsList.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEditor = (id) => {
    if (selectedEditorIds.includes(id)) {
      onChange(selectedEditorIds.filter(item => item !== id));
    } else {
      onChange([...selectedEditorIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] block">
        Assigned Editor(s) <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        placeholder="Search editors by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border border-[var(--muted-border)] rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)]"
      />
      <div className="max-h-40 overflow-y-auto border border-[var(--muted-border)] rounded-md divide-y divide-[var(--muted-border)]/50 bg-[var(--card-bg)]">
        {filteredEditors.length === 0 ? (
          <div className="p-3 text-xs text-[var(--muted)] text-center">No editors found.</div>
        ) : (
          filteredEditors.map(editor => {
            const isChecked = selectedEditorIds.includes(editor.id);
            return (
              <label
                key={editor.id}
                className="flex items-center space-x-2.5 p-2 hover:bg-[var(--foreground)]/5 cursor-pointer text-xs select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleEditor(editor.id)}
                  className="w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-[var(--foreground)]">{editor.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">{editor.email}</span>
                </div>
              </label>
            );
          })
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {selectedEditorIds.map(id => {
          const editor = editorsList.find(e => e.id === id);
          if (!editor) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
            >
              {editor.name}
              <button
                type="button"
                onClick={() => toggleEditor(id)}
                className="hover:text-red-500 font-normal focus:outline-none"
              >
                ✕
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
