'use client';

import React, { useMemo } from 'react';
import { CheckCircle2, MailCheck, Shield, UserRound } from 'lucide-react';
import Alert from '../../ui/Alert';
import Field from '../../ui/Field';
import { Input, Select } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import UserRoleSummary from './UserRoleSummary';
import SubEditorAssignmentSection from './SubEditorAssignmentSection';
import MagazineAssignmentSection from './MagazineAssignmentSection';
import { isMagazineAssignmentRole, isSubEditorRole, rolePurpose } from '../../../utils/userManagement';

export default function UserForm({
  mode,
  values,
  roles,
  editors,
  magazines,
  selectedUserId,
  errors,
  generalError,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}) {
  const selectedRole = useMemo(() => roles.find((role) => String(role.id) === String(values.role_id)) || null, [roles, values.role_id]);
  const isSubEditor = isSubEditorRole(selectedRole);
  const needsMagazineAssignment = isMagazineAssignmentRole(selectedRole);

  const setValue = (field, value) => onChange({ ...values, [field]: value });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {generalError && <ErrorAlert message={generalError} />}

      <Card className="border border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
            <CardTitle>{mode === 'create' ? 'Identity' : 'Identity and Contact'}</CardTitle>
          </div>
          <CardDescription>Basic account information visible to authorized administrators.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name" required error={errors.name}>
            <Input value={values.name} onChange={(event) => setValue('name', event.target.value)} placeholder="Jane Researcher" />
          </Field>
          <Field label="Email Address" required error={errors.email}>
            <Input type="text" value={values.email} onChange={(event) => setValue('email', event.target.value)} placeholder="jane@example.edu" />
          </Field>
          <Field label="University / Affiliation" error={errors.university_name} helperText="Optional unless backend validation requires it for this route.">
            <Input value={values.university_name} onChange={(event) => setValue('university_name', event.target.value)} placeholder="University or organization" />
          </Field>
          {mode === 'edit' && (
            <Field label="Account State" required error={errors.status} helperText="Pending Verification clears active verification until changed back to Active.">
              <Select value={values.status} onChange={(event) => setValue('status', event.target.value)}>
                <option value="active">Active</option>
                <option value="pending">Pending Verification</option>
              </Select>
            </Field>
          )}
        </CardContent>
      </Card>

      <Card className="border border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
            <CardTitle>Role and Access</CardTitle>
          </div>
          <CardDescription>Select one supported role. Permissions remain governed by backend role configuration.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
          <Field label="Access Role" required error={errors.role_id}>
            <Select value={values.role_id} onChange={(event) => setValue('role_id', event.target.value)}>
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.display_name}</option>
              ))}
            </Select>
          </Field>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            {selectedRole ? (
              <UserRoleSummary role={selectedRole} />
            ) : (
              <p className="text-sm text-[var(--muted)]">Choose a role to preview its purpose and access areas.</p>
            )}
          </div>
          {selectedRole && (
            <Alert tone="info" className="md:col-span-2" title="Role change impact">
              {rolePurpose(selectedRole)} Role changes take effect after saving and remain subject to backend authorization.
            </Alert>
          )}
        </CardContent>
      </Card>

      <SubEditorAssignmentSection
        visible={isSubEditor}
        editors={editors}
        selectedEditorIds={values.editor_ids}
        onChange={(editorIds) => setValue('editor_ids', editorIds)}
        error={errors.editor_ids}
      />

      <MagazineAssignmentSection
        visible={needsMagazineAssignment}
        magazines={magazines}
        selectedMagazineIds={values.magazine_ids}
        selectedUserId={selectedUserId}
        onChange={(magazineIds) => setValue('magazine_ids', magazineIds)}
        error={errors.magazine_ids}
      />

      {mode === 'create' && (
        <Alert tone="info" title="Password setup email">
          <span className="inline-flex items-center gap-2">
            <MailCheck className="h-4 w-4" aria-hidden="true" />
            The user will receive a secure email link to set their own password. Administrators never enter or see user passwords.
          </span>
        </Alert>
      )}

      <Card className="border border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
            <CardTitle>{mode === 'create' ? 'Review and Create' : 'Save Changes'}</CardTitle>
          </div>
          <CardDescription>Review the identity, role, and assignment requirements before submitting.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={submitting} disabled={submitting || (isSubEditor && editors.length === 0) || (needsMagazineAssignment && magazines.length === 0)}>
            {mode === 'create' ? 'Create User' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

function ErrorAlert({ message }) {
  return <Alert tone="danger" title="Action could not be completed">{message}</Alert>;
}
