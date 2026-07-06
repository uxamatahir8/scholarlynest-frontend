'use client';

import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export default function UserManagementFilters({ search, role, roles = [], onSearchChange, onRoleChange, onClear, loading }) {
  const hasFilters = Boolean(search || (role && role !== 'all'));

  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" role="search" onSubmit={(event) => event.preventDefault()}>
      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name, email, or role"
          className="pl-9 pr-10"
          aria-label="Search users"
        />
        {search && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 top-1/2 rounded-md p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            aria-label="Clear user search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="w-full sm:max-w-xs">
        <label htmlFor="user-role-filter" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          Filter by role
        </label>
        <select
          id="user-role-filter"
          value={role || 'all'}
          onChange={(event) => onRoleChange(event.target.value)}
          disabled={loading}
          className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60"
          aria-label="Filter users by role"
        >
          <option value="all">All roles</option>
          {roles.map((item) => (
            <option key={item.id} value={item.name}>{item.display_name || item.name}</option>
          ))}
        </select>
      </div>
      <Button type="button" variant="secondary" size="md" onClick={onClear} disabled={loading || !hasFilters}>
        Reset
      </Button>
    </form>
  );
}
