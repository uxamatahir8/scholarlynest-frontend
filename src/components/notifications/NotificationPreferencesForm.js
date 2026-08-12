'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Save } from 'lucide-react';
import api from '../../utils/api';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ErrorState from '../ui/ErrorState';
import LoadingState from '../ui/LoadingState';

const inputClass = 'min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]';

export default function NotificationPreferencesForm() {
  const timezones = useMemo(() => {
    const supported = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return ['UTC', ...supported.filter((zone) => zone !== 'UTC')];
  }, []);
  const [preferences, setPreferences] = useState([]);
  const [timezone, setTimezone] = useState('UTC');
  const [quietHours, setQuietHours] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/notification-preferences').then((response) => {
      if (!active) return;
      const items = response.data?.data || [];
      setPreferences(items);
      const first = items[0];
      if (first?.timezone) setTimezone(first.timezone);
      if (first?.quiet_hours) setQuietHours({ start: first.quiet_hours.start || '', end: first.quiet_hours.end || '' });
      setError(null);
    }).catch((err) => active && setError(err)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const update = (category, patch) => setPreferences((items) => items.map((item) => item.category === category ? { ...item, ...patch } : item));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const response = await api.put('/notification-preferences', {
        timezone,
        quiet_hours: { start: quietHours.start || null, end: quietHours.end || null },
        preferences: preferences.map((item) => ({
          category: item.category,
          in_app_enabled: item.in_app.enabled,
          email_mode: item.email.mode,
          digest_frequency: item.email.mode === 'digest' ? (item.digest_frequency || 'daily') : null,
        })),
      });
      setPreferences(response.data?.data || preferences);
      setSaved(true);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading notification preferences…" />;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]">Notification preferences</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Choose how optional updates reach you. Required security and workflow messages remain enabled.</p>
      </div>
      {error && <ErrorState title="Preferences could not be saved">Review your connection and try again.</ErrorState>}
      {saved && <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Preferences saved.</p>}

      <Card>
        <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-[var(--foreground)]">Timezone<select value={timezone} onChange={(event) => setTimezone(event.target.value)} className={`${inputClass} mt-2 w-full`}>{timezones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></label>
          <label className="text-sm font-semibold text-[var(--foreground)]">Quiet hours start<input type="time" value={quietHours.start} onChange={(event) => setQuietHours((value) => ({ ...value, start: event.target.value }))} className={`${inputClass} mt-2 w-full`} /></label>
          <label className="text-sm font-semibold text-[var(--foreground)]">Quiet hours end<input type="time" value={quietHours.end} onChange={(event) => setQuietHours((value) => ({ ...value, end: event.target.value }))} className={`${inputClass} mt-2 w-full`} /></label>
          <p className="text-xs text-[var(--muted)] md:col-span-3">Quiet hours apply only to optional email. In-app notifications and mandatory security or action-required email are not delayed.</p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
        <div className="divide-y divide-[var(--border)]">
          {preferences.map((item) => (
            <fieldset key={item.category} className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto] md:items-center" disabled={item.in_app.locked && item.email.allowed_modes.length === 1}>
              <div>
                <legend className="flex items-center gap-2 text-sm font-bold capitalize text-[var(--foreground)]">{item.category.replace('_', ' ')}{item.in_app.locked && <Lock className="h-3.5 w-3.5" aria-label="Required" />}</legend>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.in_app.locked ? 'Required for account safety or active workflow responsibilities.' : 'You can change in-app and email delivery.'}</p>
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={item.in_app.enabled} disabled={item.in_app.locked} onChange={(event) => update(item.category, { in_app: { ...item.in_app, enabled: event.target.checked } })} className="h-5 w-5" /> In app</label>
              <label className="text-sm font-semibold">Email<span className="sr-only"> for {item.category}</span><select value={item.email.mode} disabled={item.email.allowed_modes.length === 1} onChange={(event) => update(item.category, { email: { ...item.email, mode: event.target.value } })} className={`${inputClass} ml-2`}>
                {item.email.allowed_modes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
              </select></label>
            </fieldset>
          ))}
        </div>
      </Card>

      <div className="flex justify-end"><Button type="submit" icon={Save} isLoading={saving}>Save preferences</Button></div>
    </form>
  );
}
