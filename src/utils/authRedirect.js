import { getVisibleConsoleNavigation } from '../components/admin/console/consoleNavigation';

const DASHBOARD_PATH = '/admin';

export function sanitizeDashboardRedirect(value) {
  if (!value || typeof value !== 'string') return DASHBOARD_PATH;
  if (!value.startsWith('/admin') || value.startsWith('//')) return DASHBOARD_PATH;
  return value;
}

function userHasPermission(user, permissionName) {
  if (!user || !permissionName) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const isSuperAdmin = roles.some(({ name }) => ['super_admin', 'super-admin'].includes(name?.toLowerCase()));
  if (isSuperAdmin) return true;

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const capabilities = user.capabilities || {};
  const candidates = [permissionName];
  if (permissionName.endsWith('-own')) candidates.push(permissionName.replace('-own', '-any'));

  return candidates.some((name) => capabilities[name] || permissions.some((permission) => permission.name === name));
}

export function resolveDashboardRedirect(requestedPath, user, impersonationStatus = {}) {
  const destination = sanitizeDashboardRedirect(requestedPath);
  if (destination === DASHBOARD_PATH) return DASHBOARD_PATH;

  const pathname = destination.split(/[?#]/, 1)[0];
  const navigation = getVisibleConsoleNavigation({
    user,
    impersonationStatus,
    hasPermission: (permission) => userHasPermission(user, permission),
  });
  const permitted = navigation
    .flatMap((section) => section.items || [])
    .some((item) => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));

  return permitted ? destination : DASHBOARD_PATH;
}

export function withDashboardRedirect(path, requestedPath) {
  const destination = sanitizeDashboardRedirect(requestedPath);
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}redirect=${encodeURIComponent(destination)}`;
}
