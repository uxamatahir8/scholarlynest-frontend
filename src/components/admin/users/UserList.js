import React from 'react';
import { CalendarDays, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/Table';
import UserRoleSummary from './UserRoleSummary';
import { canOfferImpersonation, userStatus, userStatusLabel, userStatusTone } from '../../../utils/userManagement';

function UserAvatar({ user }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-sm font-bold uppercase text-[var(--foreground)]">
      {user.profile_image ? <img src={user.profile_image} alt="" className="h-full w-full object-cover" /> : user.name?.charAt(0) || 'U'}
    </div>
  );
}

function AssignmentContext({ user }) {
  const editors = user.assigned_editors || [];
  const publications = user.assigned_magazines || user.magazines || [];
  if (editors.length === 0 && publications.length === 0) return <span className="text-xs text-[var(--muted)]">—</span>;
  return (
    <div className="space-y-2">
      {publications.length > 0 && <div className="flex flex-wrap gap-1.5">
        {publications.map((publication) => (
          <Badge key={`publication-${publication.id}`} variant="outline" className="text-[10px]">
            {publication.publication_type === 'journal' ? 'Journal' : 'Magazine'} · {publication.title}
          </Badge>
        ))}
      </div>}
      {editors.length > 0 && <div className="flex flex-wrap gap-1.5">
        {editors.map((editor) => <Badge key={`editor-${editor.id}`} variant="info" className="text-[10px]">Under {editor.name}</Badge>)}
      </div>}
    </div>
  );
}

function UserActions({ user, authUser, impersonationStatus, onImpersonate }) {
  const canImpersonate = canOfferImpersonation({ authUser, targetUser: user, impersonationStatus });
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      {canImpersonate && (
        <Button type="button" variant="outline" size="sm" onClick={() => onImpersonate(user)} className="w-full sm:w-auto">
          Impersonate User
        </Button>
      )}
      <Link href={`/admin/users/${user.id}/edit`} className="w-full sm:w-auto">
        <Button type="button" variant="secondary" size="sm" className="w-full">
          Edit User
        </Button>
      </Link>
    </div>
  );
}

export default function UserList({ users, authUser, impersonationStatus, onImpersonate }) {
  return (
    <div className="space-y-3">
      <div className="hidden overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] lg:block">
        <Table label="User directory">
          <TableHeader>
            <tr>
              <TableHead>User</TableHead>
              <TableHead>Role and Access</TableHead>
              <TableHead>Account State</TableHead>
              <TableHead>Assignment Context</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const status = userStatus(user);
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--foreground)]">{user.name}</p>
                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[var(--muted)]">
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><UserRoleSummary user={user} compact /></TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Badge variant={userStatusTone(status)}>{userStatusLabel(status)}</Badge>
                      <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        Created {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'date unavailable'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell><AssignmentContext user={user} /></TableCell>
                  <TableCell className="text-right"><UserActions user={user} authUser={authUser} impersonationStatus={impersonationStatus} onImpersonate={onImpersonate} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {users.map((user) => {
          const status = userStatus(user);
          return (
            <article key={user.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <UserAvatar user={user} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold text-[var(--foreground)]">{user.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 break-all text-xs text-[var(--muted)]">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <UserRoleSummary user={user} />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={userStatusTone(status)}><ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />{userStatusLabel(status)}</Badge>
                  <span className="text-xs text-[var(--muted)]">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Created date unavailable'}</span>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold text-[var(--foreground)]">Assignment Context</p>
                  <AssignmentContext user={user} />
                </div>
                <UserActions user={user} authUser={authUser} impersonationStatus={impersonationStatus} onImpersonate={onImpersonate} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
