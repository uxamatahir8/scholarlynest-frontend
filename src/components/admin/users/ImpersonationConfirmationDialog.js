import React from 'react';
import { Button } from '../../ui/Button';
import Dialog from '../../ui/Dialog';

export default function ImpersonationConfirmationDialog({ user, open, loading, onCancel, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      title="Start Impersonation?"
      description="This starts a temporary role-scoped session for support and verification."
      dismissible={!loading}
      footer={(
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="button" variant="gold" size="sm" onClick={onConfirm} isLoading={loading}>Impersonate User</Button>
        </>
      )}
    >
      <div className="space-y-3 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          You are about to switch into <span className="font-bold text-[var(--foreground)]">{user?.name || 'this user'}</span>.
          The active impersonation banner remains the primary session indicator after the switch.
        </p>
        <p>No token values are displayed or exposed by this interface.</p>
      </div>
    </Dialog>
  );
}
