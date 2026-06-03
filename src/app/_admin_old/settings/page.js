'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ShieldCheck, ShieldAlert, KeyRound, Check, X, Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import api from '../../../utils/api';

export default function SecuritySettings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  // 2FA states
  const [toggleLoading, setToggleLoading] = useState(false);
  const [disable2FARequested, setDisable2FARequested] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [requestDisableLoading, setRequestDisableLoading] = useState(false);
  const [confirmDisableLoading, setConfirmDisableLoading] = useState(false);

  // Change Password states
  const [codeRequested, setCodeRequested] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password rule checks helper
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password);
  const passwordsMatch = password && password === passwordConfirmation;

  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  // Request password change code
  const handleRequestPasswordCode = async () => {
    setRequestLoading(true);
    try {
      await api.post('/password/request-code');
      setCodeRequested(true);
      setCodeVerified(false);
      toast('Verification code sent to your email.', 'info');
    } catch (err) {
      console.error('Failed to request password change code:', err);
      toast('Failed to send verification code to email.', 'error');
    } finally {
      setRequestLoading(false);
    }
  };

  // Verify password change code
  const handleVerifyPasswordCode = async () => {
    if (!code || code.length !== 6) {
      toast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    setVerifyLoading(true);
    try {
      await api.post('/password/verify-code', { code });
      setCodeVerified(true);
      toast('Verification code accepted. Please enter your new password.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired code.';
      toast(msg, 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Enable 2FA
  const handleEnable2FA = async () => {
    setToggleLoading(true);
    try {
      const res = await api.post('/2fa/enable');
      await refreshUser();
      toast(res.data.message || 'Two-Factor Authentication enabled.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to enable 2FA.';
      toast(msg, 'error');
    } finally {
      setToggleLoading(false);
    }
  };

  // Request 2FA disable code
  const handleInitiateDisable2FA = async () => {
    setRequestDisableLoading(true);
    try {
      await api.post('/2fa/request-disable-code');
      setDisable2FARequested(true);
      toast('Verification code sent to your email to authorize disabling 2FA.', 'info');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request disable verification code.';
      toast(msg, 'error');
    } finally {
      setRequestDisableLoading(false);
    }
  };

  // Confirm disable 2FA
  const handleConfirmDisable2FA = async (e) => {
    e.preventDefault();

    if (!disableCode || disableCode.length !== 6) {
      toast('Please enter the 6-digit code sent to your email.', 'error');
      return;
    }

    setConfirmDisableLoading(true);
    try {
      const res = await api.post('/2fa/disable', { code: disableCode });
      await refreshUser();
      setDisable2FARequested(false);
      setDisableCode('');
      toast(res.data.message || 'Two-Factor Authentication has been disabled.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to disable 2FA. Verify code.';
      toast(msg, 'error');
    } finally {
      setConfirmDisableLoading(false);
    }
  };

  // Submit password change
  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();

    if (!codeVerified) {
      toast('Please verify the authentication code first.', 'error');
      return;
    }

    if (!isPasswordStrong) {
      toast('Password does not meet the complexity requirements.', 'error');
      return;
    }

    if (!passwordsMatch) {
      toast('Passwords do not match.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await api.post('/password/change', {
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
      toast(res.data.message || 'Password changed successfully.', 'success');
      // Reset form
      setCode('');
      setPassword('');
      setPasswordConfirmation('');
      setCodeRequested(false);
      setCodeVerified(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password.';
      toast(msg, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Security Settings
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Configure multi-factor authentication and update authorization credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: 2FA controls */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#1c1c1b] border border-zinc-200/80 dark:border-zinc-800/60 rounded-xl p-6 shadow-sm flex flex-col space-y-6 h-fit">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${user.two_factor_enabled ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500'}`}>
                  {user.two_factor_enabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Two-Factor Auth</h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Secure session login challenges</p>
                </div>
              </div>

              <div className="pt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.two_factor_enabled ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800'}`}>
                  {user.two_factor_enabled ? 'Active / Enabled' : 'Disabled / Inactive'}
                </span>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                When enabled, logging into your scholar profile will require entering a 6-digit authentication token sent directly to your registered academic email.
              </p>
            </div>

            {!!user.two_factor_enabled && disable2FARequested && (
              <form onSubmit={handleConfirmDisable2FA} className="space-y-3 pt-4 border-t border-zinc-150 dark:border-zinc-800/60">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Enter Code to Disable</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] font-mono text-xs font-bold py-1.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setDisable2FARequested(false)}
                    className="w-1/2 text-xs font-bold uppercase py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={confirmDisableLoading}
                    className="w-1/2 flex items-center justify-center text-xs font-bold uppercase py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    {confirmDisableLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
                  </button>
                </div>
              </form>
            )}

            {!disable2FARequested && (
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/60">
                {user.two_factor_enabled ? (
                  <button
                    type="button"
                    disabled={requestDisableLoading}
                    onClick={handleInitiateDisable2FA}
                    className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg border border-red-200 hover:border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 transition-premium"
                  >
                    {requestDisableLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Disable 2FA'
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={toggleLoading}
                    onClick={handleEnable2FA}
                    className="w-full flex items-center justify-center text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-950 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 transition-premium"
                  >
                    {toggleLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Enable 2FA'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Change Password Form */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-[#1c1c1b] border border-zinc-200/80 dark:border-zinc-800/60 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Change Credentials</h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Require email validation for security</p>
              </div>
            </div>

            {!codeRequested ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                  For security reasons, changing your password requires generating a one-time validation code sent to your academic email profile.
                </p>
                <button
                  type="button"
                  disabled={requestLoading}
                  onClick={handleRequestPasswordCode}
                  className="flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-955 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 px-6 py-2.5 rounded-lg border border-transparent transition-premium disabled:opacity-50"
                >
                  {requestLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Requesting Code...
                    </>
                  ) : (
                    'Request Password Change Code'
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPasswordChange} className="space-y-4">
                
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 flex items-start space-x-2 text-[11px] text-blue-700 dark:text-blue-400 leading-normal">
                  <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>We sent a 6-digit confirmation code to your email. Please enter it below and verify to enable the password fields.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Authorization Code
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={code}
                      disabled={codeVerified}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-[0.5em] font-mono text-sm font-bold py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-300 disabled:opacity-60"
                    />
                    {!codeVerified && (
                      <button
                        type="button"
                        onClick={handleVerifyPasswordCode}
                        disabled={verifyLoading || code.length !== 6}
                        className="px-6 bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
                      >
                        {verifyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                      </button>
                    )}
                  </div>
                  {codeVerified && (
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                      <Check className="w-3.5 h-3.5 mr-1" /> OTP code verified successfully. You may now enter your new credentials below.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      New Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        disabled={!codeVerified}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={codeVerified ? '••••••••' : 'Verify code first'}
                        className="w-full text-xs font-medium pl-3 pr-10 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-400 disabled:opacity-50"
                      />
                      {codeVerified && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors p-0.5 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Confirm New Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordConfirmation}
                        disabled={!codeVerified}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        placeholder={codeVerified ? '••••••••' : 'Verify code first'}
                        className="w-full text-xs font-medium pl-3 pr-10 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-md focus:outline-none placeholder-zinc-400 disabled:opacity-50"
                      />
                      {codeVerified && (
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors p-0.5 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Strength Validation Helper Checklist */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800/60 rounded-lg space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Password Complexity Checklist</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center space-x-2">
                      {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span>One uppercase letter</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span>One lowercase letter</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span>One number</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasSymbol ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span>One symbol (@$!%*?&)</span>
                    </div>
                    <div className="flex items-center space-x-2 col-span-2">
                      {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCodeRequested(false);
                      setCodeVerified(false);
                      setCode('');
                    }}
                    className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 hover:underline"
                  >
                    Cancel Change
                  </button>

                  <button
                    type="submit"
                    disabled={submitLoading || !codeVerified || !isPasswordStrong || !passwordsMatch}
                    className="flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-950 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-950 px-6 py-2.5 rounded-lg border border-transparent transition-premium disabled:opacity-50"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Saving Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
