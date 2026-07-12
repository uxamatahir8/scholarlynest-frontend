import { getRoleDisplayName, normalizeRoleName } from './roles';

export const USER_PER_PAGE = 20;

export function normalizeUserPage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function userStatus(user) {
  return user?.status || (user?.email_verified_at ? 'active' : 'pending');
}

export function userStatusLabel(status) {
  return status === 'active' ? 'Active' : 'Pending Verification';
}

export function userStatusTone(status) {
  return status === 'active' ? 'success' : 'warning';
}

export function rolePurpose(role) {
  const normalized = normalizeRoleName(role);
  const purposes = {
    super_admin: 'Full platform governance and access control.',
    admin: 'Legacy administrative access with limited authority.',
    editor: 'Editorial screening, routing, and manuscript decisions.',
    sub_editor: 'Assigned manuscript review support for Editors.',
    reviewer: 'Peer review work assigned by editorial teams.',
    publisher: 'Publication, issue, and production readiness work.',
    copy_editor: 'Assigned copyediting production tasks.',
    proofreader: 'Assigned proofing and final review tasks.',
    author: 'Manuscript submission and own article tracking.',
  };
  return purposes[normalized] || `${getRoleDisplayName(role)} access configured by Super Admin.`;
}

export function roleAccessAreas(role, permissions = []) {
  const normalized = normalizeRoleName(role);
  const roleAreas = {
    super_admin: ['Users and Access', 'Publishing', 'Public Content', 'System Settings'],
    admin: ['Publishing', 'Public Content', 'System Settings'],
    editor: ['Articles and Workflow', 'Magazines and Issues'],
    sub_editor: ['Assigned Manuscripts', 'Editorial Recommendations'],
    reviewer: ['Assigned Reviews'],
    publisher: ['Issues and Publication'],
    copy_editor: ['Copyediting Tasks'],
    proofreader: ['Proofing Tasks'],
    author: ['Own Articles', 'Submissions'],
  };
  if (roleAreas[normalized]) return roleAreas[normalized];

  return Array.from(new Set((permissions || []).map((permission) => permissionCategory(permission.name || permission.module)))).slice(0, 4);
}

export function permissionCategory(name = '') {
  const value = String(name).toLowerCase();
  if (value.includes('article') || value.includes('workflow') || value.includes('review')) return 'Articles and Workflow';
  if (value.includes('magazine') || value.includes('issue')) return 'Magazines and Issues';
  if (value.includes('user') || value.includes('role') || value.includes('permission') || value.includes('impersonat')) return 'Users and Access';
  if (value.includes('footer') || value.includes('faq') || value.includes('cms') || value.includes('contact')) return 'Public Content';
  if (value.includes('newsletter') || value.includes('communication')) return 'Communications';
  if (value.includes('setting') || value.includes('seo') || value.includes('tag')) return 'System Settings';
  return 'General';
}

export function permissionLabel(permission) {
  if (!permission) return 'Permission';
  if (permission.display_name) return permission.display_name;
  return String(permission.name || '')
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bSeo\b/g, 'SEO')
    .replace(/\bCms\b/g, 'CMS');
}

export function isSubEditorRole(role) {
  return normalizeRoleName(role) === 'sub_editor';
}

export function isMagazineAssignmentRole(role) {
  return ['editor', 'publisher', 'proofreader'].includes(normalizeRoleName(role));
}

export function canOfferImpersonation({ authUser, targetUser, impersonationStatus }) {
  if (!authUser || !targetUser || impersonationStatus?.active) return false;
  if (authUser.id === targetUser.id) return false;
  if (normalizeRoleName(targetUser?.roles?.[0] || targetUser?.role) === 'super_admin') return false;
  return userStatus(targetUser) === 'active';
}
