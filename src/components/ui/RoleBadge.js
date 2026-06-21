import React from 'react';
import { Badge } from './Badge';
import { getPrimaryRole, getRoleDisplayName, normalizeRoleName } from '../../utils/roles';

const roleTone = {
  super_admin: 'gold',
  admin: 'primary',
  editor: 'primary',
  publisher: 'success',
  sub_editor: 'info',
  reviewer: 'info',
  copy_editor: 'neutral',
  proofreader: 'neutral',
  author: 'outline',
};

export default function RoleBadge({ user, role, className = '' }) {
  const primaryRole = role || getPrimaryRole(user);
  const normalized = normalizeRoleName(primaryRole);
  return <Badge variant={roleTone[normalized] || 'default'} className={className}>{getRoleDisplayName(primaryRole)}</Badge>;
}
