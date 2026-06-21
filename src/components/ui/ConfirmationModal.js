import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import Dialog from './Dialog';

export function ConfirmationModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={isLoading ? undefined : onCancel}
      title={title}
      description={message}
      dismissible={!isLoading}
      footer={(
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>{cancelText}</Button>
          <Button type="button" variant={variant} size="sm" onClick={onConfirm} isLoading={isLoading}>{confirmText}</Button>
        </>
      )}
    >
      <div className="flex items-start gap-4">
        <div className={`${variant === 'danger' ? 'bg-red-500/10 text-red-600' : variant === 'gold' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'} flex h-10 w-10 shrink-0 items-center justify-center rounded-lg`}>
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-[var(--muted)]">{message}</p>
      </div>
    </Dialog>
  );
}
