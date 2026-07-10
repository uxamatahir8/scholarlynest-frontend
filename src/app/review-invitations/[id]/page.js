'use client';

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import api from '../../../utils/api';
import { safeApiMessage } from '../../../utils/safeErrors';
import { Button } from '../../../components/ui/Button';
import Alert from '../../../components/ui/Alert';

export default function ReviewInvitationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id;
  const token = searchParams.get('token') || '';
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  const submit = async (action) => {
    setBusy(action);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/reviewer-invitations/${id}/${action}`, {
        token,
        decline_reason: declineReason,
      });
      setMessage(response.data?.message || 'Invitation response recorded.');
    } catch (err) {
      setError(safeApiMessage(err, 'Unable to update this review invitation.'));
    } finally {
      setBusy('');
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Reviewer Invitation</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">Respond to Review Invitation</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Accepting links or creates your reviewer account. Declining records your response without creating an account.
        </p>

        {!token && <Alert tone="danger" title="Missing token">This invitation link is incomplete.</Alert>}
        {message && <Alert tone="success" title="Response recorded">{message}</Alert>}
        {error && <Alert tone="danger" title="Invitation unavailable">{error}</Alert>}

        <div className="mt-6 space-y-3">
          <textarea
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
            rows={3}
            placeholder="Optional decline reason"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" icon={CheckCircle2} disabled={!token || !!message} isLoading={busy === 'accept'} onClick={() => submit('accept')}>
              Accept Review
            </Button>
            <Button type="button" variant="danger" icon={XCircle} disabled={!token || !!message} isLoading={busy === 'decline'} onClick={() => submit('decline')}>
              Decline Review
            </Button>
          </div>
          {busy && <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Updating invitation...</p>}
        </div>
      </div>
    </main>
  );
}
