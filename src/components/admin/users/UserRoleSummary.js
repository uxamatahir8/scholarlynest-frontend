import React from 'react';
import RoleBadge from '../../ui/RoleBadge';
import { Badge } from '../../ui/Badge';
import { getPrimaryRole, getRoleDisplayName, normalizeRoleName } from '../../../utils/roles';
import { roleAccessAreas, rolePurpose } from '../../../utils/userManagement';

export default function UserRoleSummary({ user, role, compact = false }) {
  const primaryRole = role || getPrimaryRole(user);
  const normalized = normalizeRoleName(primaryRole);
  const areas = roleAccessAreas(primaryRole, primaryRole?.permissions);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <RoleBadge user={user} role={primaryRole} />
        {normalized === 'sub_editor' && (user?.assigned_editors || []).length > 0 && (
          <Badge variant="info">{user.assigned_editors.length} editor link{user.assigned_editors.length === 1 ? '' : 's'}</Badge>
        )}
      </div>
      {!compact && (
        <>
          <p className="text-xs leading-relaxed text-[var(--muted)]">{rolePurpose(primaryRole)}</p>
          <div className="flex flex-wrap gap-1.5">
            {areas.map((area) => (
              <Badge key={area} variant="outline" className="text-[10px]">{area}</Badge>
            ))}
          </div>
        </>
      )}
      {compact && <span className="text-xs text-[var(--muted)]">{getRoleDisplayName(primaryRole)}</span>}
    </div>
  );
}
