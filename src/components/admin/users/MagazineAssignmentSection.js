'use client';

import React, { useMemo, useState } from 'react';
import { BookOpenCheck, ChevronDown, Search } from 'lucide-react';
import Alert from '../../ui/Alert';
import Field from '../../ui/Field';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';

const GROUPS = [
  ['editors', 'Assigned Editors'],
  ['publishers', 'Assigned Publishers'],
  ['proofreaders', 'Assigned Proofreaders'],
];

export default function MagazineAssignmentSection({
  visible,
  magazines,
  selectedMagazineIds,
  selectedUserId,
  onChange,
  error,
  roleName,
}) {
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);

  const selectedIds = useMemo(() => selectedMagazineIds.map((id) => Number(id)), [selectedMagazineIds]);

  const typeLabel = useMemo(() => {
    if (roleName === 'magazine_editor') return 'Magazine';
    if (roleName === 'journal_editor') return 'Journal';
    return 'Publication';
  }, [roleName]);

  const typePluralLabel = useMemo(() => {
    if (roleName === 'magazine_editor') return 'Magazines';
    if (roleName === 'journal_editor') return 'Journals';
    return 'Publications';
  }, [roleName]);

  const filteredMagazines = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return magazines.filter((magazine) => (
      !normalizedQuery || String(magazine.title || '').toLowerCase().includes(normalizedQuery)
    ));
  }, [magazines, query]);

  const toggleMagazine = (magazineId) => {
    const numericId = Number(magazineId);
    onChange(selectedIds.includes(numericId)
      ? selectedIds.filter((id) => id !== numericId)
      : [...selectedIds, numericId]);
  };

  const toggleExpanded = (magazineId) => {
    const numericId = Number(magazineId);
    setExpandedIds((current) => current.includes(numericId)
      ? current.filter((id) => id !== numericId)
      : [...current, numericId]);
  };

  if (!visible) return null;

  return (
    <Card className="border border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
          <CardTitle>{typeLabel} Access</CardTitle>
        </div>
        <CardDescription>Select the {typePluralLabel.toLowerCase()} this user may manage or work on.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {magazines.length === 0 ? (
          <Alert tone="warning" title={`No ${typePluralLabel.toLowerCase()} available`}>
            Create a {typeLabel.toLowerCase()} before assigning this role.
          </Alert>
        ) : (
          <>
            <Field
              label={`Assigned ${typeLabel}(s)`}
              required
              error={error}
              helperText={`Select at least one ${typeLabel.toLowerCase()}. Backend authorization uses these role-aware assignments.`}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${typePluralLabel.toLowerCase()} by title`}
                  className="pl-9"
                />
              </div>
            </Field>

            <div className="grid max-h-[28rem] gap-3 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2">
              {filteredMagazines.length === 0 ? (
                <p className="p-3 text-sm text-[var(--muted)]">No matching {typePluralLabel.toLowerCase()} are available.</p>
              ) : filteredMagazines.map((magazine) => {
                const isSelected = selectedIds.includes(Number(magazine.id));
                const isExpanded = expandedIds.includes(Number(magazine.id));
                const summary = magazine.assignment_summary || {};
                const summaryText = assignmentSummaryText(summary);
                const hasAssignments = GROUPS.some(([key]) => (summary[key] || []).length > 0);

                return (
                  <article
                    key={magazine.id}
                    className={`rounded-lg border bg-[var(--surface)] p-3 transition-colors ${
                      isSelected ? 'border-[var(--accent)]' : 'border-transparent'
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMagazine(magazine.id)}
                        className="mt-1 h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[var(--foreground)]">
                            {magazine.publication_type === 'journal' ? 'Journal' : 'Magazine'} · {magazine.title}
                          </span>
                          {isSelected && <Badge variant="success">Selected</Badge>}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--muted)]">{summaryText}</span>
                      </span>
                    </label>

                    {hasAssignments && (
                      <div className="mt-3 border-t border-[var(--border)] pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          icon={ChevronDown}
                          onClick={() => toggleExpanded(magazine.id)}
                          aria-expanded={isExpanded}
                          className="px-2"
                        >
                          View current assignments
                        </Button>
                        {isExpanded && (
                          <div className="mt-2 grid gap-2 rounded-md bg-[var(--surface-muted)] p-3">
                            {GROUPS.map(([key, label]) => (
                              <AssignmentGroup
                                key={key}
                                label={label}
                                users={summary[key] || []}
                                selectedUserId={selectedUserId}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {selectedIds.length === 0 && (
              <Alert tone="warning" title={`${typeLabel} access required`}>
                This role cannot be saved without at least one {typeLabel.toLowerCase()} assignment.
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AssignmentGroup({ label, users, selectedUserId }) {
  if (!users.length) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{label}</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {users.map((user) => (
          <li key={user.id}>
            <Badge variant={Number(user.id) === Number(selectedUserId) ? 'info' : 'neutral'}>
              {user.name}{Number(user.id) === Number(selectedUserId) ? ' (current user)' : ''}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function assignmentSummaryText(summary) {
  const parts = [
    countLabel((summary.editors || []).length, 'Editor'),
    countLabel((summary.publishers || []).length, 'Publisher'),
    countLabel((summary.proofreaders || []).length, 'Proofreader'),
  ].filter(Boolean);

  return parts.length ? parts.join(' · ') : 'No current role assignments';
}

function countLabel(count, label) {
  if (!count) return null;
  return `${count} ${label}${count === 1 ? '' : 's'} assigned`;
}
