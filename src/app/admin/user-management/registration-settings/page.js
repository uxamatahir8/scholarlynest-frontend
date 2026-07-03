'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Save } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import { safeApiMessage } from '../../../../utils/safeErrors';
import Alert from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';
import ErrorState from '../../../../components/ui/ErrorState';
import Field from '../../../../components/ui/Field';
import { Select } from '../../../../components/ui/Input';
import LoadingState from '../../../../components/ui/LoadingState';
import Textarea from '../../../../components/ui/Textarea';
import RegistrationStatusPanel from '../../../../components/admin/users/RegistrationStatusPanel';

export default function RegistrationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, hasRole, loading: authLoading, impersonationStatus } = useAuth();
  const canUsePage = Boolean(authUser && hasRole('super_admin') && !impersonationStatus?.active);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [settings, setSettings] = useState({
    registration_enabled: true,
    default_role_id: '',
    email_verification_required: true,
    registration_notice: '',
  });
  const [originalEnabled, setOriginalEnabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDisable, setConfirmDisable] = useState(false);

  const selectedRole = useMemo(() => roleOptions.find((role) => String(role.id) === String(settings.default_role_id)) || null, [roleOptions, settings.default_role_id]);

  const fetchData = async () => {
    if (!canUsePage) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const [settingsResponse, optionsResponse] = await Promise.all([
        api.get('/admin/user-management/registration-settings'),
        api.get('/admin/user-management/registration-role-options'),
      ]);
      const data = settingsResponse.data?.data || {};
      const options = optionsResponse.data?.data || [];
      const nextSettings = {
        registration_enabled: Boolean(data.registration_enabled),
        default_role_id: data.default_role?.id || options[0]?.id || '',
        email_verification_required: Boolean(data.email_verification_required),
        registration_notice: data.registration_notice || '',
      };
      setRoleOptions(options);
      setSettings(nextSettings);
      setOriginalEnabled(nextSettings.registration_enabled);
      setValidationErrors({});
    } catch (error) {
      setErrorMessage(safeApiMessage(error, 'Registration settings could not be loaded.'));
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

  const submitSettings = async () => {
    const errors = {};
    if (!settings.default_role_id) errors.default_role_id = 'Default public role is required.';
    if (settings.registration_notice.length > 500) errors.registration_notice = 'Registration notice must be 500 characters or fewer.';
    setValidationErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const response = await api.patch('/admin/user-management/registration-settings', {
        registration_enabled: settings.registration_enabled,
        default_role_id: Number(settings.default_role_id),
        registration_notice: settings.registration_notice,
      });
      const data = response.data?.data || {};
      const nextSettings = {
        registration_enabled: Boolean(data.registration_enabled),
        default_role_id: data.default_role?.id || settings.default_role_id,
        email_verification_required: Boolean(data.email_verification_required),
        registration_notice: data.registration_notice || '',
      };
      setSettings(nextSettings);
      setOriginalEnabled(nextSettings.registration_enabled);
      setValidationErrors({});
      toast('Registration settings saved.', 'success');
    } catch (error) {
      const apiErrors = error?.response?.data?.errors || {};
      setValidationErrors({
        registration_enabled: apiErrors.registration_enabled?.[0],
        default_role_id: apiErrors.default_role_id?.[0],
        registration_notice: apiErrors.registration_notice?.[0],
      });
      toast(safeApiMessage(error, 'Registration settings could not be saved.'), 'error');
    } finally {
      setSaving(false);
      setConfirmDisable(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (originalEnabled && !settings.registration_enabled) {
      setConfirmDisable(true);
      return;
    }
    submitSettings();
  };

  if (authLoading || (!canUsePage && authUser)) {
    return <LoadingState label="Checking registration-settings privileges..." className="min-h-[420px]" />;
  }

  if (!canUsePage) {
    return <ErrorState title="Access Restricted">Only non-impersonated Super Admin sessions can view registration settings.</ErrorState>;
  }

  return (
    <main className="space-y-6">
      <title>Registration Settings - ScholarlyNest</title>
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">People and Access</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Registration Settings</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Control backend-enforced public author registration, default public role, verification expectations, and registration notice text.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={fetchData} disabled={loading} icon={RefreshCw}>Refresh</Button>
      </header>

      {errorMessage && <ErrorState title="Registration settings unavailable">{errorMessage}</ErrorState>}

      {loading ? (
        <LoadingState label="Loading registration controls..." className="min-h-[360px]" />
      ) : (
        <form onSubmit={handleSubmit} className="max-w-5xl space-y-5">
          <RegistrationStatusPanel
            enabled={settings.registration_enabled}
            role={selectedRole}
            verificationRequired={settings.email_verification_required}
          />

          <Card className="border border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Public Registration Status</CardTitle>
              <CardDescription>When disabled, the backend rejects public registration before creating an account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <input
                  type="checkbox"
                  checked={settings.registration_enabled}
                  onChange={(event) => setSettings((current) => ({ ...current, registration_enabled: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus-visible:ring-[var(--focus-ring)]"
                />
                <span>
                  <span className="block text-sm font-bold text-[var(--foreground)]">Allow public registration</span>
                  <span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">
                    Visitors can create self-service Author accounts only. Privileged roles are never available through public registration.
                  </span>
                </span>
              </label>
              {validationErrors.registration_enabled && <p className="text-sm font-semibold text-red-600">{validationErrors.registration_enabled}</p>}
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Default Public Role</CardTitle>
              <CardDescription>Role availability is supplied by the backend and currently limited to Author registration.</CardDescription>
            </CardHeader>
            <CardContent>
              <Field label="Default registration role" required error={validationErrors.default_role_id} helperText="This setting cannot grant public users privileged workflow or administrative roles.">
                <Select value={settings.default_role_id} onChange={(event) => setSettings((current) => ({ ...current, default_role_id: event.target.value }))}>
                  {roleOptions.length === 0 ? (
                    <option value="">No eligible role returned by backend</option>
                  ) : roleOptions.map((role) => (
                    <option key={role.id} value={role.id}>{role.display_name}</option>
                  ))}
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Verification Requirements</CardTitle>
              <CardDescription>Email verification is enforced by the existing public registration flow.</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert tone="info" title="Email verification is always required">
                This page displays the backend-enforced verification state. Manual approval is not implemented as a configurable setting.
              </Alert>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Registration Notice</CardTitle>
              <CardDescription>Short guidance shown around public registration.</CardDescription>
            </CardHeader>
            <CardContent>
              <Field label="Notice text" error={validationErrors.registration_notice} helperText={`${settings.registration_notice.length}/500 characters`}>
                <Textarea
                  value={settings.registration_notice}
                  onChange={(event) => setSettings((current) => ({ ...current, registration_notice: event.target.value }))}
                  placeholder="Create an author account to submit manuscripts."
                  rows={4}
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={fetchData} disabled={saving}>Reset</Button>
            <Button type="submit" variant="primary" icon={Save} isLoading={saving} disabled={saving || roleOptions.length === 0}>Save Changes</Button>
          </div>
        </form>
      )}

      <ConfirmationModal
        isOpen={confirmDisable}
        title="Disable Public Registration?"
        message="New public author sign-ups will be rejected by the backend until registration is enabled again."
        confirmText="Disable Registration"
        cancelText="Keep Enabled"
        variant="gold"
        isLoading={saving}
        onConfirm={submitSettings}
        onCancel={() => setConfirmDisable(false)}
      />
    </main>
  );
}
