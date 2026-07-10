'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import { safeApiMessage } from '../../../../utils/safeErrors';
import { Button } from '../../../../components/ui/Button';
import ErrorState from '../../../../components/ui/ErrorState';
import LoadingState from '../../../../components/ui/LoadingState';
import UserForm from '../../../../components/admin/users/UserForm';
import { isMagazineAssignmentRole, isSubEditorRole } from '../../../../utils/userManagement';

const initialValues = {
  name: '',
  email: '',
  university_name: '',
  role_id: '',
  status: 'active',
  editor_ids: [],
  magazine_ids: [],
};

export default function CreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, hasRole, loading: authLoading, impersonationStatus } = useAuth();
  const canUsePage = Boolean(authUser && hasRole('super_admin') && !impersonationStatus?.active);

  const [values, setValues] = useState(initialValues);
  const [roles, setRoles] = useState([]);
  const [editors, setEditors] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!canUsePage) {
      router.replace('/admin');
      return;
    }

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [rolesResponse, editorsResponse, magazineResponse] = await Promise.all([
          api.get('/admin/rbac/roles'),
          api.get('/admin/users', { params: { role: 'editor' } }),
          api.get('/admin/users/magazine-assignment-options'),
        ]);
        setRoles(rolesResponse.data || []);
        setEditors(editorsResponse.data || []);
        setMagazines(magazineResponse.data?.magazines || []);
      } catch (error) {
        setGeneralError(safeApiMessage(error, 'Role and Editor options could not be loaded.'));
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [authLoading, canUsePage, router]);

  const validate = () => {
    const errors = {};
    if (!values.name.trim()) errors.name = 'Name is required.';
    if (!values.email.trim()) errors.email = 'Email address is required.';
    if (!values.role_id) errors.role_id = 'Role assignment is required.';
    const selectedRole = roles.find((role) => String(role.id) === String(values.role_id));
    if (isSubEditorRole(selectedRole) && values.editor_ids.length === 0) {
      errors.editor_ids = 'At least one Editor must be assigned to a Sub Editor.';
    }
    if (isMagazineAssignmentRole(selectedRole) && values.magazine_ids.length === 0) {
      errors.magazine_ids = 'Select at least one magazine for this role.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
      status: 'active',
    };
    if (isSubEditorRole(selectedRole)) payload.editor_ids = values.editor_ids;
    if (isMagazineAssignmentRole(selectedRole)) payload.magazine_ids = values.magazine_ids;

    setSubmitting(true);
    setGeneralError('');
    try {
      await api.post('/admin/users', payload);
      toast('User created and password setup email sent.', 'success');
      router.push('/admin/users');
    } catch (error) {
      const apiErrors = error?.response?.data?.errors || {};
      setFieldErrors({
        name: apiErrors.name?.[0],
        email: apiErrors.email?.[0],
        role_id: apiErrors.role_id?.[0],
        university_name: apiErrors.university_name?.[0],
        editor_ids: apiErrors.editor_ids?.[0],
        magazine_ids: apiErrors.magazine_ids?.[0],
      });
      setGeneralError(safeApiMessage(error, 'User account could not be created.'));
      toast('User account could not be created.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (!canUsePage && authUser) || loadingOptions) {
    return <LoadingState label="Loading user creation workspace..." className="min-h-[420px]" />;
  }

  if (!canUsePage) {
    return <ErrorState title="Access Restricted">Only non-impersonated Super Admin sessions can create users.</ErrorState>;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <title>Create User - ScholarlyNest</title>
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start">
        <Button type="button" variant="outline" size="sm" icon={ArrowLeft} onClick={() => router.push('/admin/users')} className="self-start">
          Back to Users
        </Button>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">New Account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Create User</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Create a role-scoped account. The user will receive a secure email to set their own password.
          </p>
        </div>
      </header>

      <UserForm
        mode="create"
        values={values}
        roles={roles}
        editors={editors}
        magazines={magazines}
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
