'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, KeyRound, Loader2, Mail, RefreshCw, ShieldCheck, Smartphone, Trash2, X } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { useToast } from '../../../context/ToastContext';
import Alert from '../../ui/Alert';
import { Button } from '../../ui/Button';
import Field from '../../ui/Field';
import { Input } from '../../ui/Input';

const methodLabel = { email: 'Email Code', totp: 'Authenticator App' };

export default function AuthenticatorMfaPanel({ refreshUser }) {
  const { toast } = useToast();
  const [mfa, setMfa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState(null);
  const [setupCode, setSetupCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [savedCodes, setSavedCodes] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmation, setConfirmation] = useState({ current_password: '', code: '' });
  const [emailDisableCode, setEmailDisableCode] = useState('');
  const [emailDisableOpen, setEmailDisableOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get('/me/security/mfa');
      setMfa(response.data.mfa);
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to load MFA settings.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const perform = async (action, success) => {
    try {
      setLoading(true);
      await action();
      await Promise.all([load(), refreshUser()]);
      toast(success, 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to update MFA settings.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setLoading(true);
      const response = await api.post('/me/security/mfa/totp/setup');
      setWizard({ step: 1, ...response.data });
      setSetupCode('');
    } catch (err) {
      toast(safeApiMessage(err, 'Unable to start authenticator setup.'), 'error');
    } finally { setLoading(false); }
  };

  const verifySetup = async () => {
    if (!/^\d{6}$/.test(setupCode)) return toast('Enter a 6-digit authenticator code.', 'error');
    try {
      setLoading(true);
      const response = await api.post('/me/security/mfa/totp/verify', { code: setupCode });
      setRecoveryCodes(response.data.recovery_codes);
      setSavedCodes(false);
      setWizard({ step: 3 });
      setMfa(response.data.mfa);
      await refreshUser();
    } catch (err) {
      toast(safeApiMessage(err, 'The authenticator code could not be verified.'), 'error');
    } finally { setLoading(false); }
  };

  const copyCodes = async () => {
    await navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast('Recovery codes copied.', 'success');
  };

  const downloadCodes = () => {
    const blob = new Blob([`Scholarly Nest recovery codes\n\n${recoveryCodes.join('\n')}\n`], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scholarly-nest-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const runSensitiveAction = async () => {
    try {
      setLoading(true);
      const endpoint = confirmAction === 'disable' ? '/me/security/mfa/totp/disable' : '/me/security/mfa/recovery-codes/regenerate';
      const response = await api.post(endpoint, confirmation);
      if (confirmAction === 'regenerate') {
        setRecoveryCodes(response.data.recovery_codes);
        setSavedCodes(false);
        setWizard({ step: 3 });
      }
      setConfirmAction(null);
      setConfirmation({ current_password: '', code: '' });
      await Promise.all([load(), refreshUser()]);
      toast(confirmAction === 'disable' ? 'Authenticator App MFA disabled.' : 'Recovery codes regenerated.', 'success');
    } catch (err) {
      toast(safeApiMessage(err, 'Security confirmation failed.'), 'error');
    } finally { setLoading(false); }
  };

  const requestEmailDisable = async () => {
    try {
      setLoading(true);
      await api.post('/2fa/request-disable-code');
      setEmailDisableOpen(true);
      toast('A disable code was sent to your email.', 'success');
    } catch (err) { toast(safeApiMessage(err, 'Unable to send the disable code.'), 'error'); }
    finally { setLoading(false); }
  };

  const disableEmail = async () => {
    if (!/^\d{6}$/.test(emailDisableCode)) return toast('Enter the 6-digit email code.', 'error');
    await perform(() => api.post('/2fa/disable', { code: emailDisableCode }), 'Email Code MFA disabled.');
    setEmailDisableOpen(false);
    setEmailDisableCode('');
  };

  if (loading && !mfa) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const enabled = mfa?.enabled_methods || [];

  return <div className="space-y-4">
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <div className="flex items-center gap-3"><ShieldCheck className={`h-5 w-5 ${mfa?.is_enabled ? 'text-emerald-600' : 'text-[var(--muted)]'}`} /><div><p className="text-sm font-bold">{mfa?.is_enabled ? 'Enabled' : 'Disabled'}</p><p className="text-xs text-[var(--muted)]">Default: {methodLabel[mfa?.default_method] || 'None'}</p></div></div>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>

    <div className="space-y-3">
      <MethodRow icon={Mail} title="Email Code" enabled={enabled.includes('email')} defaultMethod={mfa?.default_method === 'email'}>
        {enabled.includes('email') ? <><Button type="button" variant="outline" onClick={() => perform(() => api.post('/me/security/mfa/default-method', { method: 'email' }), 'Default method updated.')} disabled={mfa?.default_method === 'email'}>Set Default</Button><Button type="button" variant="danger" onClick={requestEmailDisable}>Disable</Button></> : <Button type="button" onClick={() => perform(() => api.post('/2fa/enable'), 'Email Code MFA enabled.')}>Enable</Button>}
      </MethodRow>
      <MethodRow icon={Smartphone} title="Authenticator App" enabled={enabled.includes('totp')} defaultMethod={mfa?.default_method === 'totp'}>
        {enabled.includes('totp') ? <><Button type="button" variant="outline" onClick={() => perform(() => api.post('/me/security/mfa/default-method', { method: 'totp' }), 'Default method updated.')} disabled={mfa?.default_method === 'totp'}>Set Default</Button><Button type="button" variant="outline" icon={RefreshCw} onClick={() => setConfirmAction('regenerate')}>Recovery Codes</Button><Button type="button" variant="danger" icon={Trash2} onClick={() => setConfirmAction('disable')}>Disable</Button></> : <Button type="button" icon={Smartphone} onClick={startSetup}>Enable Authenticator App</Button>}
      </MethodRow>
    </div>
    {enabled.includes('totp') && <p className="text-xs text-[var(--muted)]">{mfa.recovery_codes_remaining} unused recovery codes remain.</p>}

    {wizard && <Modal title="Set up Authenticator App">
      {wizard.step === 1 && <div className="space-y-5">
        <Alert tone="info" title="Step 1 of 3 — Scan QR code">Scan with Google Authenticator, Microsoft Authenticator, Authy, 1Password, or Bitwarden.</Alert>
        <div className="flex justify-center rounded-xl bg-white p-5"><QRCodeSVG value={wizard.otpauth_uri} size={210} level="M" /></div>
        <Field label="Manual setup key"><div className="flex gap-2"><Input readOnly value={wizard.manual_setup_key} className="font-mono" /><Button type="button" variant="outline" icon={Copy} onClick={() => navigator.clipboard.writeText(wizard.manual_setup_key)}>Copy</Button></div></Field>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setWizard(null)}>Cancel</Button><Button type="button" onClick={() => setWizard({ ...wizard, step: 2 })}>Continue</Button></div>
      </div>}
      {wizard.step === 2 && <div className="space-y-5">
        <Alert tone="info" title="Step 2 of 3 — Verify">Enter the current 6-digit code from your authenticator app.</Alert>
        <Field label="Authenticator code"><Input value={setupCode} inputMode="numeric" autoComplete="one-time-code" maxLength={6} onChange={(event) => setSetupCode(event.target.value.replace(/\D/g, ''))} /></Field>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setWizard({ ...wizard, step: 1 })}>Back</Button><Button type="button" onClick={verifySetup} isLoading={loading}>Verify and Enable</Button></div>
      </div>}
      {wizard.step === 3 && <div className="space-y-5">
        <Alert tone="warning" title="Step 3 of 3 — Save recovery codes">These codes are shown only once. Store them somewhere secure; each code works once.</Alert>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 font-mono text-sm">{recoveryCodes.map((code) => <span key={code}>{code}</span>)}</div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" icon={Copy} onClick={copyCodes}>Copy Codes</Button><Button type="button" variant="outline" icon={Download} onClick={downloadCodes}>Download Codes</Button></div>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={savedCodes} onChange={(event) => setSavedCodes(event.target.checked)} />I have saved these recovery codes.</label>
        <div className="flex justify-end"><Button type="button" icon={Check} disabled={!savedCodes} onClick={() => { setWizard(null); setRecoveryCodes([]); }}>Finish</Button></div>
      </div>}
    </Modal>}

    {confirmAction && <Modal title={confirmAction === 'disable' ? 'Disable Authenticator App?' : 'Regenerate recovery codes?'} onClose={() => setConfirmAction(null)}>
      <div className="space-y-4"><Alert tone="warning" title="Security confirmation">Confirm with your current password or a fresh authenticator code.</Alert><Field label="Current password"><Input type="password" value={confirmation.current_password} onChange={(event) => setConfirmation((value) => ({ ...value, current_password: event.target.value }))} /></Field><div className="text-center text-xs text-[var(--muted)]">or</div><Field label="Authenticator code"><Input inputMode="numeric" maxLength={6} value={confirmation.code} onChange={(event) => setConfirmation((value) => ({ ...value, code: event.target.value.replace(/\D/g, '') }))} /></Field><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button><Button type="button" variant={confirmAction === 'disable' ? 'danger' : 'primary'} onClick={runSensitiveAction} isLoading={loading}>Confirm</Button></div></div>
    </Modal>}

    {emailDisableOpen && <Modal title="Disable Email Code MFA" onClose={() => setEmailDisableOpen(false)}><div className="space-y-4"><Alert tone="warning" title="Check your email">Enter the 6-digit confirmation code sent to your account email.</Alert><Field label="Confirmation code"><Input inputMode="numeric" maxLength={6} value={emailDisableCode} onChange={(event) => setEmailDisableCode(event.target.value.replace(/\D/g, ''))} /></Field><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setEmailDisableOpen(false)}>Cancel</Button><Button type="button" variant="danger" onClick={disableEmail} isLoading={loading}>Disable Email MFA</Button></div></div></Modal>}
  </div>;
}

function MethodRow({ icon: Icon, title, enabled, defaultMethod, children }) {
  return <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] p-4"><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-amber-700 dark:text-amber-400" /><div className="flex-1"><p className="text-sm font-bold">{title}</p><p className="text-xs text-[var(--muted)]">{enabled ? 'Enabled and verified' : 'Not enabled'}{defaultMethod ? ' · Default' : ''}</p></div></div><div className="flex flex-wrap gap-2">{children}</div></div>;
}

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-4"><h2 className="text-xl font-bold">{title}</h2>{onClose && <button type="button" aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button>}</div>{children}</section></div>;
}
