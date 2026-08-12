'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import { useToast } from '../../../../../context/ToastContext';
import api from '../../../../../utils/api';
import { safeApiMessage } from '../../../../../utils/safeErrors';
import Alert from '../../../../../components/ui/Alert';
import { Button } from '../../../../../components/ui/Button';
import ErrorState from '../../../../../components/ui/ErrorState';
import LoadingState from '../../../../../components/ui/LoadingState';
import UserForm from '../../../../../components/admin/users/UserForm';
import PageTitle from '../../../../../components/PageTitle';
import { isMagazineAssignmentRole, isSubEditorRole } from '../../../../../utils/userManagement';
import { adminUserSchemaFor, validateWithZod } from '../../../../../lib/validation';

const initialValues = {
  name: '',
  email: '',
  university_name: '',
  role_id: '',
  status: 'active',
  editor_ids: [],
  magazine_ids: [],
};

export default function EditUserPage() {
  const router = useRouter();
  const { id: userId } = useParams();
  const { toast } = useToast();
  const { user: authUser, hasRole, loading: authLoading, impersonationStatus } = useAuth();
  const canUsePage = Boolean(authUser && hasRole('super_admin') && !impersonationStatus?.active);

  const [values, setValues] = useState(initialValues);
  const [originalRoleId, setOriginalRoleId] = useState('');
  const [roles, setRoles] = useState([]);
  const [editors, setEditors] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!canUsePage) {
      router.replace('/admin');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setGeneralError('');
      try {
        const [rolesResponse, editorsResponse, magazineResponse, userResponse] = await Promise.all([
          api.get('/admin/rbac/roles'),
          api.get('/admin/users', { params: { role: 'editor' } }),
          api.get('/admin/users/magazine-assignment-options'),
          api.get(`/admin/users/${userId}`),
        ]);
        const nextRoles = rolesResponse.data || [];
        const user = userResponse.data || {};
        const roleId = user.roles?.[0]?.id ? String(user.roles[0].id) : '';
        setRoles(nextRoles);
        setEditors(editorsResponse.data || []);
        setMagazines(magazineResponse.data?.magazines || []);
        setOriginalRoleId(roleId);
        setValues({
          name: user.name || '',
          email: user.email || '',
          university_name: user.university || user.university_name || '',
          role_id: roleId,
          status: user.status || 'active',
          editor_ids: (user.assigned_editors || []).map((editor) => editor.id),
          magazine_ids: (user.assigned_magazines || []).map((magazine) => magazine.id),
        });
      } catch (error) {
        setGeneralError(safeApiMessage(error, 'User details could not be loaded.'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, canUsePage, router, userId]);

  const validate = () => {
    const selectedRole = roles.find((role) => String(role.id) === String(values.role_id));
    const schema = adminUserSchemaFor({
      requireStatus: true,
      requireEditorAssignment: isSubEditorRole(selectedRole),
      requireMagazineAssignment: isMagazineAssignmentRole(selectedRole),
    });
    const validation = validateWithZod(schema, values);
    setFieldErrors(validation.errors);
    return validation.success;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) return;

    const selectedRole = roles.find((role) => String(role.id) === String(values.role_id));
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      university_name: values.university_name.trim() || null,
      role_id: Number(values.role_id),
      status: values.status,
    };
    if (isSubEditorRole(selectedRole)) payload.editor_ids = values.editor_ids;
    if (isMagazineAssignmentRole(selectedRole)) payload.magazine_ids = values.magazine_ids;

    setSubmitting(true);
    setGeneralError('');
    try {
      await api.patch(`/admin/users/${userId}`, payload);
      toast('User account updated.', 'success');
      router.push('/admin/users');
    } catch (error) {
      const apiErrors = error?.response?.data?.errors || {};
      setFieldErrors({
        name: apiErrors.name?.[0],
        email: apiErrors.email?.[0],
        role_id: apiErrors.role_id?.[0],
        status: apiErrors.status?.[0],
        university_name: apiErrors.university_name?.[0],
        editor_ids: apiErrors.editor_ids?.[0],
        magazine_ids: apiErrors.magazine_ids?.[0],
      });
      setGeneralError(safeApiMessage(error, 'User account could not be updated.'));
      toast('User account could not be updated.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (!canUsePage && authUser) || loading) {
    return <LoadingState label="Loading user account..." className="min-h-[420px]" />;
  }

  if (!canUsePage) {
    return <ErrorState title="Access Restricted">Only non-impersonated Super Admin sessions can edit users.</ErrorState>;
  }

  if (generalError && !values.email) {
    return (
      <main className="space-y-5">
        <ErrorState title="User details unavailable">{generalError}</ErrorState>
        <Button type="button" variant="outline" icon={ArrowLeft} onClick={() => router.push('/admin/users')}>Back to Users</Button>
      </main>
    );
  }

  const roleChanged = originalRoleId && originalRoleId !== String(values.role_id);

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <PageTitle title={values.name ? `Edit User - ${values.name}` : 'Edit User'} />
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start">
        <Button type="button" variant="outline" size="sm" icon={ArrowLeft} onClick={() => router.push('/admin/users')} className="self-start">
          Back to Users
        </Button>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Account Configuration</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Edit User</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Update identity, account state, access role, and Sub Editor assignment relationships.
          </p>
        </div>
      </header>

      {roleChanged && (
        <Alert tone="warning" title="Role change pending">
          Saving this form will change this user&apos;s access role. If the user is no longer a Sub Editor, existing Editor links will be detached by backend rules.
          If the selected role uses magazine access, submitted magazine assignments become the backend authorization scope for that role.
        </Alert>
      )}

      <UserForm
        mode="edit"
        values={values}
        roles={roles}
        editors={editors}
        magazines={magazines}
        selectedUserId={Number(userId)}
        errors={fieldErrors}
        generalError={generalError}
        submitting={submitting}
        onChange={(nextValues) => {
          setValues(nextValues);
          setFieldErrors({});
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/users')}
      />
    </main>
  );
}
