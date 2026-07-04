'use client';

import {
  BookOpen,
  ClipboardCheck,
  FileCheck2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Newspaper,
  Settings,
  Tags,
  UserCheck,
  Users,
  Workflow,
} from 'lucide-react';
import { hasRole as userHasRole } from '../../../utils/roles';

const hasAnyRole = (user, roles = []) => roles.some((role) => userHasRole(user, role));

const can = (hasPermission, permission) => {
  if (!permission) return true;
  if (!hasPermission) return false;
  return hasPermission(permission);
};

export const consoleNavigation = [
  {
    group: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
      {
        label: 'My Articles',
        href: '/admin/articles',
        icon: FileText,
        isVisible: ({ user, hasPermission }) => userHasRole(user, 'author') && can(hasPermission, 'articles.view-own') && !can(hasPermission, 'articles.view-any'),
      },
      {
        label: 'New Submission',
        href: '/admin/articles/new',
        icon: FileText,
        isVisible: ({ user, hasPermission }) => userHasRole(user, 'author') || can(hasPermission, 'articles.create'),
      },
    ],
  },
  {
    group: 'Editorial',
    items: [
      {
        label: 'Articles & Workflow',
        href: '/admin/articles',
        icon: Workflow,
        isVisible: ({ user, hasPermission }) => can(hasPermission, 'articles.view-any') || hasAnyRole(user, ['super_admin', 'admin', 'editor', 'magazine_editor']),
      },
      {
        label: 'My Sub Editors',
        href: '/admin/editor/sub-editors',
        icon: Users,
        isVisible: ({ user }) => hasAnyRole(user, ['editor', 'magazine_editor']),
      },
      {
        label: 'Sub Editor Desk',
        href: '/admin/sub-editor',
        icon: ClipboardCheck,
        isVisible: ({ user, impersonationStatus }) => !userHasRole(user, 'super_admin') && hasAnyRole(user, ['admin', 'sub_editor']) || (userHasRole(user, 'super_admin') && !impersonationStatus?.active),
      },
      {
        label: 'Reviewer Desk',
        href: '/admin/reviewer',
        icon: UserCheck,
        isVisible: ({ user, impersonationStatus }) => !userHasRole(user, 'super_admin') && hasAnyRole(user, ['admin', 'reviewer']) || (userHasRole(user, 'super_admin') && !impersonationStatus?.active),
      },
      {
        label: 'Copy Editor Desk',
        href: '/admin/copy-editor',
        icon: FileCheck2,
        isVisible: ({ user, impersonationStatus }) => !userHasRole(user, 'super_admin') && hasAnyRole(user, ['admin', 'copy_editor']) || (userHasRole(user, 'super_admin') && !impersonationStatus?.active),
      },
      {
        label: 'Proofreader Desk',
        href: '/admin/proofreader',
        icon: FileCheck2,
        isVisible: ({ user, impersonationStatus }) => !userHasRole(user, 'super_admin') && hasAnyRole(user, ['admin', 'proofreader']) || (userHasRole(user, 'super_admin') && !impersonationStatus?.active),
      },
      {
        label: 'Publisher Desk',
        href: '/admin/publisher',
        icon: Newspaper,
        isVisible: ({ user, impersonationStatus }) => !userHasRole(user, 'super_admin') && hasAnyRole(user, ['admin', 'publisher']) || (userHasRole(user, 'super_admin') && !impersonationStatus?.active),
      },
    ],
  },
  {
    group: 'Publishing',
    items: [
      {
        label: 'Magazines',
        href: '/admin/magazines',
        icon: BookOpen,
        isVisible: ({ user, hasPermission }) => (can(hasPermission, 'magazines.view-any') || can(hasPermission, 'magazines.view-own')) && !userHasRole(user, 'author'),
      },
      {
        label: 'Issue Manager',
        href: '/admin/issues',
        icon: Newspaper,
        isVisible: ({ user }) => hasAnyRole(user, ['super_admin', 'admin', 'publisher', 'editor', 'magazine_editor']),
      },
      {
        label: 'Magazine Tags',
        href: '/admin/magazines/tags',
        icon: Tags,
        isVisible: ({ user }) => hasAnyRole(user, ['super_admin', 'admin']),
      },
    ],
  },
  {
    group: 'People',
    items: [
      {
        label: 'Users',
        href: '/admin/users',
        icon: Users,
        isVisible: ({ user, impersonationStatus }) => userHasRole(user, 'super_admin') && !impersonationStatus?.active,
      },
      {
        label: 'Roles & Permissions',
        href: '/admin/user-management/roles-permissions',
        icon: UserCheck,
        isVisible: ({ user, hasPermission, impersonationStatus }) => userHasRole(user, 'super_admin') && !impersonationStatus?.active && can(hasPermission, 'roles.view-any'),
      },
    ],
  },
  {
    group: 'Public Content',
    items: [
      {
        label: 'FAQ Management',
        href: '/admin/cms/faqs',
        icon: HelpCircle,
        isVisible: ({ hasPermission }) => can(hasPermission, 'settings.view-any') || can(hasPermission, 'settings.manage') || can(hasPermission, 'footer.manage'),
      },
      {
        label: 'Footer Content',
        href: '/admin/footer-cms',
        icon: FileText,
        isVisible: ({ hasPermission }) => can(hasPermission, 'footer.manage') || can(hasPermission, 'settings.manage'),
      },
      {
        label: 'Contact Settings',
        href: '/admin/contact-settings',
        icon: Mail,
        isVisible: ({ hasPermission }) => can(hasPermission, 'settings.view-any') || can(hasPermission, 'settings.manage') || can(hasPermission, 'footer.manage'),
      },
      {
        label: 'Contact Messages',
        href: '/admin/contact-messages',
        icon: MessageSquare,
        isVisible: ({ hasPermission }) => can(hasPermission, 'settings.view-any') || can(hasPermission, 'settings.manage') || can(hasPermission, 'footer.manage'),
      },
      {
        label: 'Newsletter',
        href: '/admin/newsletter',
        icon: Mail,
        isVisible: ({ hasPermission }) => can(hasPermission, 'newsletters.view-any'),
      },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'My Account', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    group: 'System Settings',
    items: [
      {
        label: 'Registration Settings',
        href: '/admin/user-management/registration-settings',
        icon: Settings,
        isVisible: ({ user, impersonationStatus }) => userHasRole(user, 'super_admin') && !impersonationStatus?.active,
      },
      {
        label: 'Article Types',
        href: '/admin/settings/types',
        icon: Settings,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) || can(hasPermission, 'settings.manage'),
      },
      {
        label: 'Categories',
        href: '/admin/settings/categories',
        icon: Settings,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) || can(hasPermission, 'settings.manage'),
      },
      {
        label: 'Subject Areas',
        href: '/admin/settings/subject-areas',
        icon: Settings,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) || can(hasPermission, 'settings.manage'),
      },
      {
        label: 'Languages',
        href: '/admin/settings/languages',
        icon: Settings,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) || can(hasPermission, 'settings.manage'),
      },
    ],
  },
];

export function getVisibleConsoleNavigation(context) {
  return consoleNavigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => (item.isVisible ? item.isVisible(context) : true)),
    }))
    .filter((section) => section.items.length > 0);
}

export function flattenConsoleNavigation(sections) {
  return sections.flatMap((section) => section.items);
}

export function getConsoleRouteMeta(pathname, items) {
  if (!pathname) return { title: 'Console', section: 'Workspace' };
  const match = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)));

  if (match) return { title: match.label, href: match.href };
  return { title: 'Console', href: '/admin' };
}
