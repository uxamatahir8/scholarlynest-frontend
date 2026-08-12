export const observerRoles = {
  reviewer: 'Reviewer',
  sub_editor: 'Sub Editor',
  copy_editor: 'Copy Editor',
  proofreader: 'Proofreader',
  publisher: 'Publisher',
  editor: 'All Editors',
  super_editor: 'Super Editor',
  magazine_editor: 'Magazine Editor',
  journal_editor: 'Journal Editor',
};

export const observerParam = 'observer_user';
export const observerRoleParam = 'observer_role';

export function normalizeObserverRole(role) {
  return String(role || '').replaceAll('-', '_');
}

export function observerRoleLabel(role) {
  return observerRoles[normalizeObserverRole(role)] || 'Role';
}

export function observerUserId(searchParams) {
  const value = searchParams.get(observerParam);
  return value && /^\d+$/.test(value) ? Number(value) : null;
}

export function observerApiParam(activeUser) {
  return activeUser ? { observer_user_id: activeUser.id } : {};
}
