'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw, Save, ShieldAlert, ToggleLeft } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import api from '../../../../utils/api';
import { safeApiMessage } from '../../../../utils/safeErrors';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';

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
    registration_notice: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [saved, setSaved] = useState(false);

  const selectedRole = useMemo(() => (
    roleOptions.find((role) => String(role.id) === String(settings.default_role_id)) || null
  ), [roleOptions, settings.default_role_id]);

  const fetchData = async () => {
    if (!canUsePage) return;

    setLoading(true);
    setErrorMessage('');
    setSaved(false);
    try {
      const [settingsRes, optionsRes] = await Promise.all([
        api.get('/admin/user-management/registration-settings'),
        api.get('/admin/user-management/registration-role-options')
      ]);
      const data = settingsRes.data?.data || {};
      const options = optionsRes.data?.data || [];
      setRoleOptions(options);
      setSettings({
        registration_enabled: Boolean(data.registration_enabled),
        default_role_id: data.default_role?.id || options[0]?.id || '',
        email_verification_required: Boolean(data.email_verification_required),
        registration_notice: data.registration_notice || ''
      });
      setValidationErrors({});
    } catch (err) {
      setErrorMessage('Registration settings could not be loaded.');
      toast('Registration settings could not be loaded.', 'error');
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

  const clearFieldError = (field) => {
    if (!validationErrors[field]) return;
    setValidationErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaved(false);
    setErrorMessage('');

    const errors = {};
    if (!settings.default_role_id) {
      errors.default_role_id = 'Default Registration Role is required.';
    }
    if (settings.registration_notice.length > 500) {
      errors.registration_notice = 'Registration Notice must be 500 characters or fewer.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/admin/user-management/registration-settings', {
        registration_enabled: settings.registration_enabled,
        default_role_id: Number(settings.default_role_id),
        registration_notice: settings.registration_notice
      });
      const data = res.data?.data || {};
      setSettings({
        registration_enabled: Boolean(data.registration_enabled),
        default_role_id: data.default_role?.id || settings.default_role_id,
        email_verification_required: Boolean(data.email_verification_required),
        registration_notice: data.registration_notice || ''
      });
      setValidationErrors({});
      setSaved(true);
      toast('Registration settings saved.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Registration settings could not be saved.'), 'error');
      const apiErrors = err?.response?.data?.errors || {};
      setValidationErrors({
        registration_enabled: apiErrors.registration_enabled?.[0],
        default_role_id: apiErrors.default_role_id?.[0],
        registration_notice: apiErrors.registration_notice?.[0]
      });
    } finally {
      setSaving(false);
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
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">Only non-impersonated Super Admin sessions can view registration settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <title>Registration Settings - ScholarlyNest</title>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Registration Settings
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5 font-medium max-w-2xl">
            Control public account creation and the low-privilege role assigned to new self-registered users.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="gap-1.5 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
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
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Loading settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="max-w-3xl space-y-5">
          <Card className="border border-[var(--muted-border)] bg-[var(--card-bg)] shadow-md rounded-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <ToggleLeft className="w-4 h-4 text-[var(--muted)]" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">Public Registration</CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">
                When disabled, public sign-up requests are rejected before a user account is created.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="flex items-start gap-3 rounded-lg border border-[var(--muted-border)] bg-[var(--foreground)]/[0.02] p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.registration_enabled}
                  onChange={(event) => {
                    setSettings((current) => ({ ...current, registration_enabled: event.target.checked }));
                    clearFieldError('registration_enabled');
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--muted-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-bold text-[var(--foreground)]">Public Registration Enabled</span>
                  <span className="block text-xs leading-relaxed text-[var(--muted)] mt-1">
                    Allows visitors to create a self-service author account from the public registration form.
                  </span>
                  {validationErrors.registration_enabled && (
                    <span className="block text-red-500 text-[10px] font-bold mt-2">{validationErrors.registration_enabled}</span>
                  )}
                </span>
              </label>

              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]" htmlFor="default-role">
                  Default Registration Role
                </label>
                <select
                  id="default-role"
                  value={settings.default_role_id}
                  onChange={(event) => {
                    setSettings((current) => ({ ...current, default_role_id: event.target.value }));
                    clearFieldError('default_role_id');
                  }}
                  className={`w-full max-w-sm text-xs font-semibold px-3 py-2 bg-[var(--foreground)]/5 border rounded-md focus:outline-none text-[var(--foreground)] ${
                    validationErrors.default_role_id ? 'border-red-500' : 'border-[var(--muted-border)]'
                  }`}
                >
                  {roleOptions.length === 0 ? (
                    <option value="">No eligible roles available</option>
                  ) : roleOptions.map((role) => (
                    <option key={role.id} value={role.id}>{role.display_name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--muted)] max-w-lg">
                  New self-registered users receive this role. Privileged workflow and administration roles are never offered here.
                </p>
                {selectedRole && (
                  <p className="text-[10px] font-mono text-[var(--muted)]">Selected role: {selectedRole.name}</p>
                )}
                {validationErrors.default_role_id && (
                  <span className="text-red-500 text-[10px] font-bold block">{validationErrors.default_role_id}</span>
                )}
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]" htmlFor="registration-notice">
                  Registration Notice
                </label>
                <textarea
                  id="registration-notice"
                  rows={4}
                  value={settings.registration_notice}
                  onChange={(event) => {
                    setSettings((current) => ({ ...current, registration_notice: event.target.value }));
                    clearFieldError('registration_notice');
                  }}
                  className={`w-full text-xs font-medium px-3 py-2 bg-[var(--foreground)]/5 border rounded-md focus:outline-none placeholder-zinc-400 text-[var(--foreground)] resize-none ${
                    validationErrors.registration_notice ? 'border-red-500' : 'border-[var(--muted-border)]'
                  }`}
                  placeholder="Create an author account to submit manuscripts."
                />
                <div className="flex items-center justify-between max-w-full">
                  <p className="text-[11px] text-[var(--muted)]">A short notice for the registration experience.</p>
                  <span className="text-[10px] text-[var(--muted)]">{settings.registration_notice.length}/500</span>
                </div>
                {validationErrors.registration_notice && (
                  <span className="text-red-500 text-[10px] font-bold block">{validationErrors.registration_notice}</span>
                )}
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg text-xs flex items-start gap-2.5 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Email verification is currently enforced by the public registration flow and is not configurable from this page.
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={saving || roleOptions.length === 0}
              className="gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
