const ROLE_PRECEDENCE = [
  'super_admin',
  'admin',
  'editor',
  'magazine_editor',
  'publisher',
  'sub_editor',
  'reviewer',
  'copy_editor',
  'proofreader',
  'author',
];

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  magazine_editor: 'Magazine Editor',
  publisher: 'Publisher',
  sub_editor: 'Sub Editor',
  reviewer: 'Reviewer',
  copy_editor: 'Copy Editor',
  proofreader: 'Proofreader',
  author: 'Author',
};

export function normalizeRoleName(role) {
  const rawName = typeof role === 'string'
    ? role
    : role?.name || role?.slug || role?.key || role?.display_name || '';

  return String(rawName).trim().toLowerCase().replaceAll('-', '_').replace(/\s+/g, '_');
}

export function getRolePriority(role) {
  const normalized = normalizeRoleName(role);
  const index = ROLE_PRECEDENCE.indexOf(normalized);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function collectRoles(user) {
  if (!user) return [];
  const roles = [];
  if (user.role) roles.push(user.role);
  if (Array.isArray(user.roles)) roles.push(...user.roles);
  if (typeof user.role === 'string') roles.push(user.role);
  return roles.filter(Boolean);
}

export function getPrimaryRole(user) {
  const roles = collectRoles(user);
  if (roles.length === 0) return null;

  return roles
    .map((role) => ({ role, priority: getRolePriority(role) }))
    .sort((a, b) => a.priority - b.priority)[0]?.role || null;
}

export function getRoleDisplayName(userOrRole) {
  const role = userOrRole?.roles || userOrRole?.role
    ? getPrimaryRole(userOrRole)
    : userOrRole;

  if (!role) return 'User';

  const normalized = normalizeRoleName(role);
  if (ROLE_LABELS[normalized]) return ROLE_LABELS[normalized];

  const displayName = typeof role === 'object' ? role.display_name || role.label : null;
  return displayName || 'User';
}

export function hasRole(user, role) {
  const expected = normalizeRoleName(role);
  if (!expected) return false;
  return collectRoles(user).some((item) => normalizeRoleName(item) === expected);
}

export { ROLE_PRECEDENCE, ROLE_LABELS };
