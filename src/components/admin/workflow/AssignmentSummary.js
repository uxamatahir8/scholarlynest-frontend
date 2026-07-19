import React from 'react';
import { UsersRound } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import WorkflowSection from './WorkflowSection';
import { labelize } from './workflowDisplay';

export default function AssignmentSummary({ article, canSeeReviewerIdentity }) {
  const rows = [];
  const pendingTransfer = article.pending_transfer_request?.status === 'pending'
    ? article.pending_transfer_request
    : null;

  if (pendingTransfer) {
    rows.push({
      key: `transfer-${pendingTransfer.id}`,
      label: 'Transfer requested by',
      name: pendingTransfer.requested_by?.name || 'Editorial team',
      status: 'Pending Author Decision',
      details: `${pendingTransfer.from_magazine?.title || 'Current publication'} → ${pendingTransfer.to_magazine?.title || 'Requested publication'}`,
    });
  }

  (article.sub_editor_assignments || []).forEach((assignment) => {
    rows.push({
      key: `sub-${assignment.id}`,
      label: 'Sub Editor',
      name: assignment.sub_editor?.name || 'Assigned',
      status: labelize(assignment.status),
    });
  });

  (article.reviewer_assignments || []).forEach((assignment, index) => {
    rows.push({
      key: `reviewer-${assignment.id}`,
      label: 'Reviewer',
      name: canSeeReviewerIdentity ? assignment.invitee_name || assignment.reviewer?.name || 'Assigned reviewer' : `Reviewer ${index + 1}`,
      status: labelize(assignment.invitation_state || assignment.status),
    });
  });

  (article.production_assignments || []).forEach((assignment) => {
    rows.push({
      key: `production-${assignment.id}`,
      label: labelize(assignment.role),
      name: assignment.user?.name || 'Assigned',
      status: labelize(assignment.status),
    });
  });

  return (
    <WorkflowSection title="Assignments" description="Current work linked to this manuscript, limited to what your role may see." icon={UsersRound}>
      {rows.length === 0 ? (
        <EmptyState title="No visible assignments">Assignment context will appear here when it is available to your role.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.key} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{row.label}</p>
              <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-[var(--foreground)]">{row.name}</p>
                <p className="text-xs font-semibold text-[var(--muted)]">{row.status}</p>
              </div>
              {row.details && <p className="mt-2 text-xs text-[var(--muted)]">{row.details}</p>}
            </li>
          ))}
        </ul>
      )}
    </WorkflowSection>
  );
}
