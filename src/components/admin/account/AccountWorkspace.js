'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Eye, EyeOff, KeyRound, LockKeyhole, Mail, RefreshCw, Save, ShieldCheck, ShieldOff, UserRound } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { logError } from '../../../utils/safeLogger';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import Alert from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import ErrorState from '../../ui/ErrorState';
import Field from '../../ui/Field';
import { Input } from '../../ui/Input';
import LoadingState from '../../ui/LoadingState';
import { uploadAndAwaitClean } from '../../../lib/mediaUploads/DirectUploadClient';
import AuthenticatorMfaPanel from './AuthenticatorMfaPanel';
import {
  changePasswordSchema,
  currentEmailCodeSchema,
  disableTwoFactorSchema,
  newEmailCodeSchema,
  newEmailRequestSchema,
  profileSchema,
  validateWithZod,
  verificationCodeSchema,
} from '../../../lib/validation';

const passwordRuleText = 'Use at least 8 characters with uppercase, lowercase, number, and symbol.';

function roleLabel(user) {
  const role = user?.role || user?.roles?.[0];
  return role?.display_name || role?.name?.replaceAll('_', ' ') || 'Account user';
}

function verifiedLabel(user) {
  return user?.email_verified_at ? 'Verified' : 'Verification required';
}

function StatusPill({ tone = 'neutral', children }) {
  const classes = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    neutral: 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]',
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[tone] || classes.neutral}`}>
      {children}
    </span>
  );
}

function Section({ eyebrow, title, description, children, action }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">{eyebrow}</p>}
          <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
        </div>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

export default function AccountWorkspace() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState({ name: '', email: '', university_name: '', profile_image: '', profile_image_upload_id: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [passwordState, setPasswordState] = useState({
    codeRequested: false,
    codeVerified: false,
    code: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [requestingPasswordCode, setRequestingPasswordCode] = useState(false);
  const [verifyingPasswordCode, setVerifyingPasswordCode] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailWizardOpen, setEmailWizardOpen] = useState(false);
  const [emailStep, setEmailStep] = useState(1);
  const [currentEmailCode, setCurrentEmailCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmailCode, setNewEmailCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailErrors, setEmailErrors] = useState({});

  const [disable2faOpen, setDisable2faOpen] = useState(false);
  const [disable2faCode, setDisable2faCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorErrors, setTwoFactorErrors] = useState({});

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name || '',
      email: user.email || '',
      university_name: user.university_name || '',
      profile_image: user.profile_image || '',
      profile_image_upload_id: '',
    });
  }, [user]);

  const accountSummary = useMemo(() => [
    { label: 'Account role', value: roleLabel(user), tone: 'neutral' },
    { label: 'Email state', value: verifiedLabel(user), tone: user?.email_verified_at ? 'success' : 'warning' },
    { label: 'Two-factor', value: user?.two_factor_enabled ? 'Enabled' : 'Disabled', tone: user?.two_factor_enabled ? 'success' : 'neutral' },
  ], [user]);

  const validateProfile = () => {
    const validation = validateWithZod(profileSchema, {
      name: profile.name,
      university_name: profile.university_name,
    });
    setProfileErrors(validation.errors);
    return validation.success;
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!validateProfile()) return;
    try {
      setSavingProfile(true);
      await api.put('/profile', {
        name: profile.name.trim(),
        university_name: profile.university_name.trim() || null,
        ...(profile.profile_image_upload_id
          ? { profile_image_upload_id: profile.profile_image_upload_id }
          : { profile_image: profile.profile_image || null }),
      });
      await refreshUser();
      toast('Profile updated.', 'success');
    } catch (err) {
      logError('Failed to update profile:', err);
      toast(safeApiMessage(err, 'Unable to update profile.'), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadProfileImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Choose an image file.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('Image must be smaller than 10MB.', 'error');
      return;
    }

    try {
      setUploadingImage(true);
      const upload = await uploadAndAwaitClean({ file, purpose: 'profile_image' });
      const previewUrl = URL.createObjectURL(file);
      setProfile((current) => ({ ...current, profile_image: previewUrl, profile_image_upload_id: upload.id }));
      const response = await api.put('/profile', { profile_image_upload_id: upload.id });
      const persistedImage = response.data?.user?.profile_image_url || response.data?.user?.profile_image || '';
      setProfile((current) => ({ ...current, profile_image: persistedImage || previewUrl, profile_image_upload_id: '' }));
      await refreshUser();
      if (persistedImage) URL.revokeObjectURL(previewUrl);
      toast('Profile image updated.', 'success');
    } catch (err) {
      logError('Failed to upload profile image:', err);
      toast(safeApiMessage(err, 'Unable to upload profile image.'), 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const requestPasswordCode = async () => {
    try {
      setRequestingPasswordCode(true);
      await api.post('/password/request-code');
      setPasswordState((current) => ({ ...current, codeRequested: true, codeVerified: false }));
      toast('Password change code sent to your email.', 'success');
    } catch (err) {
      logError('Failed to request password code:', err);
      toast(safeApiMessage(err, 'Unable to send password change code.'), 'error');
    } finally {
      setRequestingPasswordCode(false);
    }
  };

  const verifyPasswordCode = async () => {
    const validation = validateWithZod(verificationCodeSchema, { code: passwordState.code });
    setPasswordErrors(validation.errors);
    if (!validation.success) return;
    try {
      setVerifyingPasswordCode(true);
      await api.post('/password/verify-code', { code: passwordState.code });
      setPasswordState((current) => ({ ...current, codeVerified: true }));
      toast('Password change code verified.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'This password change code is invalid or expired.'), 'error');
    } finally {
      setVerifyingPasswordCode(false);
    }
  };

  const validatePassword = () => {
    const validation = validateWithZod(changePasswordSchema, passwordState);
    const errors = { ...validation.errors };
    if (errors.codeVerified) {
      errors.code = errors.codeVerified;
      delete errors.codeVerified;
    }
    setPasswordErrors(errors);
    return validation.success;
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (!validatePassword()) return;
    try {
      setSavingPassword(true);
      await api.post('/password/change', {
        code: passwordState.code,
        password: passwordState.password,
        password_confirmation: passwordState.password_confirmation,
      });
      setPasswordState({ codeRequested: false, codeVerified: false, code: '', password: '', password_confirmation: '' });
      toast('Password updated.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to update password.'), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const resetEmailWizard = () => {
    setEmailWizardOpen(false);
    setEmailStep(1);
    setCurrentEmailCode('');
    setNewEmail('');
    setNewEmailCode('');
    setEmailErrors({});
  };

  const requestCurrentEmailCode = async () => {
    try {
      setEmailLoading(true);
      await api.post('/profile/email/request-current-code');
      toast('Verification code sent to your current email.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to send current-email verification code.'), 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const verifyCurrentEmailCode = async () => {
    const validation = validateWithZod(currentEmailCodeSchema, { currentEmailCode });
    setEmailErrors(validation.errors);
    if (!validation.success) return;
    try {
      setEmailLoading(true);
      await api.post('/profile/email/verify-current-code', { code: currentEmailCode });
      setEmailStep(2);
      toast('Current email verified.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'This verification code is invalid or expired.'), 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const requestNewEmailCode = async () => {
    const validation = validateWithZod(newEmailRequestSchema, { newEmail, currentEmail: profile.email });
    setEmailErrors(validation.errors);
    if (!validation.success) return;
    try {
      setEmailLoading(true);
      await api.post('/profile/email/request-new-code', { email: newEmail.trim() });
      toast('Confirmation code sent to your new email.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to send new-email confirmation code.'), 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const verifyNewEmailCode = async () => {
    const validation = validateWithZod(newEmailCodeSchema, { newEmailCode });
    setEmailErrors(validation.errors);
    if (!validation.success) return;
    try {
      setEmailLoading(true);
      await api.post('/profile/email/verify-new-code', { code: newEmailCode });
      await refreshUser();
      toast('Email address updated.', 'success');
      resetEmailWizard();
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to confirm new email address.'), 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const enableTwoFactor = async () => {
    try {
      setTwoFactorLoading(true);
      await api.post('/2fa/enable');
      await refreshUser();
      toast('Two-factor authentication enabled.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to enable two-factor authentication.'), 'error');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const requestDisableTwoFactor = async () => {
    try {
      setTwoFactorLoading(true);
      await api.post('/2fa/request-disable-code');
      setDisable2faOpen(true);
      toast('Disable code sent to your email.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to request two-factor disable code.'), 'error');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    const validation = validateWithZod(disableTwoFactorSchema, { disable2faCode });
    setTwoFactorErrors(validation.errors);
    if (!validation.success) return;
    try {
      setTwoFactorLoading(true);
      await api.post('/2fa/disable', { code: disable2faCode });
      await refreshUser();
      setDisable2faOpen(false);
      setDisable2faCode('');
      toast('Two-factor authentication disabled.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to disable two-factor authentication.'), 'error');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (authLoading) return <LoadingState label="Loading account settings..." className="min-h-[420px]" />;
  if (!user) return <ErrorState title="Account unavailable">Sign in again to manage your account settings.</ErrorState>;

  return (
    <main className="space-y-6">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Personal Settings</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">My Account</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Manage your profile, email ownership, password, and supported security controls. System-level settings remain separate from this personal account area.
            </p>
          </div>
          <Button type="button" variant="outline" icon={RefreshCw} onClick={refreshUser}>Refresh Account</Button>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {accountSummary.map((item) => (
            <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <dt className="text-xs font-semibold text-[var(--muted)]">{item.label}</dt>
              <dd className="mt-2"><StatusPill tone={item.tone}>{item.value}</StatusPill></dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Section eyebrow="Profile" title="Profile and Identity" description="These details belong to your account and do not change your role or permissions.">
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)]">
                  {profile.profile_image ? (
                    <img src={profile.profile_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-8 w-8 text-[var(--muted)]" aria-hidden="true" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    {uploadingImage ? 'Uploading...' : 'Choose Profile Image'}
                    <input type="file" accept="image/*" className="sr-only" onChange={uploadProfileImage} disabled={uploadingImage} />
                  </label>
                  <p className="text-xs leading-5 text-[var(--muted)]">Your image is saved automatically after the security scan.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name" required error={profileErrors.name}>
                  <Input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
                </Field>
                <Field label="Email address" helperText="Use the email-change workflow to update this address.">
                  <Input value={profile.email} readOnly />
                </Field>
              </div>
              <Field label="University or affiliation" error={profileErrors.university_name}>
                <Input value={profile.university_name} onChange={(event) => setProfile((current) => ({ ...current, university_name: event.target.value }))} />
              </Field>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" icon={Mail} onClick={() => setEmailWizardOpen(true)}>Change Email</Button>
                <Button type="submit" icon={Save} isLoading={savingProfile}>Save Profile</Button>
              </div>
            </form>
          </Section>

          <Section eyebrow="Password" title="Password Change" description="Password changes are authorized with a verification code sent to your account email.">
            <form onSubmit={changePassword} className="space-y-5">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">Email verification code</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">Request and verify a code before setting a new password.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={requestPasswordCode} isLoading={requestingPasswordCode}>
                    {passwordState.codeRequested ? 'Send New Code' : 'Send Code'}
                  </Button>
                </div>
                {passwordState.codeRequested && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,220px)_auto] sm:items-start">
                    <Field label="Verification code" error={passwordErrors.code}>
                      <Input value={passwordState.code} inputMode="numeric" maxLength={6} onChange={(event) => setPasswordState((current) => ({ ...current, code: event.target.value }))} />
                    </Field>
                    <Button type="button" variant="secondary" className="sm:mt-6" onClick={verifyPasswordCode} isLoading={verifyingPasswordCode}>
                      Verify Code
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="New password" helperText={passwordRuleText} error={passwordErrors.password}>
                  <div className="relative">
                    <Input disabled={!passwordState.codeVerified} type={showPassword ? 'text' : 'password'} value={passwordState.password} autoComplete="new-password" onChange={(event) => setPasswordState((current) => ({ ...current, password: event.target.value }))} className="pr-11" />
                    <button type="button" aria-label={showPassword ? 'Hide new password' : 'Show new password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm new password" error={passwordErrors.password_confirmation}>
                  <div className="relative">
                    <Input disabled={!passwordState.codeVerified} type={showConfirmPassword ? 'text' : 'password'} value={passwordState.password_confirmation} autoComplete="new-password" onChange={(event) => setPasswordState((current) => ({ ...current, password_confirmation: event.target.value }))} className="pr-11" />
                    <button type="button" aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'} onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" icon={KeyRound} isLoading={savingPassword} disabled={!passwordState.codeVerified}>Update Password</Button>
              </div>
            </form>
          </Section>
        </div>

        <aside className="space-y-6">
          <Section eyebrow="Security" title="Account Status" description="Security context from your authenticated account payload.">
            <div className="space-y-3">
              <Alert tone={user.email_verified_at ? 'success' : 'warning'} title={user.email_verified_at ? 'Email verified' : 'Email verification required'}>
                {user.email_verified_at ? 'Your account email is verified.' : 'Complete email verification before relying on account recovery and protected workflows.'}
              </Alert>
              {user.needs_password_reset && (
                <Alert tone="warning" title="Password reset required">
                  Your account was provisioned with a required password reset state.
                </Alert>
              )}
            </div>
          </Section>

          <Section eyebrow="Multi-Factor" title="Multi-Factor Authentication" description="Protect sign-in with email codes, an authenticator app, and single-use recovery codes.">
            <AuthenticatorMfaPanel refreshUser={refreshUser} />
          </Section>

        </aside>
      </div>

      {emailWizardOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="email-change-title" className="w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="border-b border-[var(--border)] pb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Email Ownership</p>
              <h2 id="email-change-title" className="mt-1 text-xl font-bold text-[var(--foreground)]">Change Email Address</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Verify your current email first, then confirm the new email address.</p>
            </div>

            {emailStep === 1 ? (
              <div className="space-y-4 pt-5">
                <Alert tone="info" title="Step 1">
                  Send a code to your current email address and enter it here.
                </Alert>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                  <Field label="Current email code" error={emailErrors.currentEmailCode}>
                    <Input value={currentEmailCode} inputMode="numeric" maxLength={6} onChange={(event) => setCurrentEmailCode(event.target.value)} />
                  </Field>
                  <Button type="button" variant="outline" className="sm:mt-6" onClick={requestCurrentEmailCode} isLoading={emailLoading}>Send Code</Button>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={resetEmailWizard}>Cancel</Button>
                  <Button type="button" onClick={verifyCurrentEmailCode} isLoading={emailLoading}>Verify Current Email</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-5">
                <Alert tone="info" title="Step 2">
                  Enter the new email address, request its code, then confirm it.
                </Alert>
                <Field label="New email address" error={emailErrors.newEmail}>
                  <Input type="text" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                  <Field label="New email code" error={emailErrors.newEmailCode}>
                    <Input value={newEmailCode} inputMode="numeric" maxLength={6} onChange={(event) => setNewEmailCode(event.target.value)} />
                  </Field>
                  <Button type="button" variant="outline" className="sm:mt-6" onClick={requestNewEmailCode} isLoading={emailLoading}>Send Code</Button>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={resetEmailWizard}>Cancel</Button>
                  <Button type="button" onClick={verifyNewEmailCode} isLoading={emailLoading}>Confirm New Email</Button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmationModal
        isOpen={disable2faOpen}
        title="Disable two-factor authentication?"
        message="Enter the 6-digit code sent to your email to disable two-factor authentication."
        confirmText="Disable 2FA"
        cancelText="Cancel"
        variant="danger"
        isLoading={twoFactorLoading}
        onConfirm={disableTwoFactor}
        onCancel={() => {
          setDisable2faOpen(false);
          setDisable2faCode('');
          setTwoFactorErrors({});
        }}
      >
        <Field label="Disable code" error={twoFactorErrors.disable2faCode}>
          <Input value={disable2faCode} inputMode="numeric" maxLength={6} onChange={(event) => setDisable2faCode(event.target.value)} />
        </Field>
      </ConfirmationModal>
    </main>
  );
}
