'use client';

import {
  AtSign,
  BookMarked,
  CalendarRange,
  CircleHelp,
  CircleUserRound,
  ClipboardPenLine,
  CloudUpload,
  FilePlus2,
  FileText,
  Files,
  FolderTree,
  Gauge,
  Headset,
  Inbox,
  Languages,
  Megaphone,
  LibraryBig,
  NotebookTabs,
  ListChecks,
  Microscope,
  Network,
  Bell,
  PanelBottom,
  PenLine,
  ScanText,
  Send,
  Shapes,
  ShieldCheck,
  Tags,
  TicketCheck,
  UserPlus,
  UserRound,
  UserRoundCog,
  UsersRound,
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
      { label: 'Dashboard', href: '/admin', icon: Gauge, exact: true },
      {
        label: 'My Articles',
        href: '/admin/articles',
        icon: FileText,
        isVisible: ({ user, hasPermission }) => userHasRole(user, 'author') && can(hasPermission, 'articles.view-own') && !can(hasPermission, 'articles.view-any'),
      },
      {
        label: 'New Submission',
        href: '/admin/articles/new',
        icon: FilePlus2,
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
        icon: Network,
        isVisible: ({ user, hasPermission }) => can(hasPermission, 'articles.view-any') || hasAnyRole(user, ['super_admin', 'admin', 'editor', 'super_editor', 'magazine_editor', 'journal_editor']),
      },
      {
        label: 'Editor Desk',
        href: '/admin/editor',
        icon: PenLine,
        exact: true,
        isVisible: ({ user, hasPermission }) => can(hasPermission, 'articles.view-any') || hasAnyRole(user, ['super_admin', 'admin', 'editor', 'super_editor', 'magazine_editor', 'journal_editor']),
      },
      {
        label: 'My Sub Editors',
        href: '/admin/editor/sub-editors',
        icon: UserRoundCog,
        isVisible: ({ user }) => hasAnyRole(user, ['editor']),
      },
      {
        label: 'Sub Editor Desk',
        href: '/admin/sub-editor',
        icon: ClipboardPenLine,
        isVisible: ({ user, impersonationStatus }) => !userHasRole(user, 'super_admin') && hasAnyRole(user, ['admin', 'sub_editor']) || (userHasRole(user, 'super_admin') && !impersonationStatus?.active),
      },
      {
        label: 'Reviewer Desk',
        href: '/admin/reviewer',
        icon: UsersRound,
        isVisible: ({ user, impersonationStatus }) => !userHasRole(user, 'super_admin') && hasAnyRole(user, ['admin', 'reviewer']) || (userHasRole(user, 'super_admin') && !impersonationStatus?.active),
      },
      {
        label: 'Copy Editor Desk',
        href: '/admin/copy-editor',
        icon: Files,
        isVisible: ({ user, impersonationStatus }) => !userHasRole(user, 'super_admin') && hasAnyRole(user, ['admin', 'copy_editor']) || (userHasRole(user, 'super_admin') && !impersonationStatus?.active),
      },
      {
        label: 'Proofreader Desk',
        href: '/admin/proofreader',
        icon: ScanText,
        isVisible: () => false,
      },
      {
        label: 'Publisher Desk',
        href: '/admin/publisher',
        icon: BookMarked,
        isVisible: ({ user, impersonationStatus }) => !userHasRole(user, 'super_admin') && hasAnyRole(user, ['admin', 'publisher']) || (userHasRole(user, 'super_admin') && !impersonationStatus?.active),
      },
    ],
  },
  {
    group: 'Publishing',
    items: [
      {
        label: 'Direct Publications',
        href: '/admin/direct-publications',
        icon: CloudUpload,
        isVisible: ({ user }) => hasAnyRole(user, ['super_admin', 'publisher']),
      },
      {
        label: 'Magazines',
        href: '/admin/magazines',
        icon: LibraryBig,
        isVisible: ({ user, hasPermission }) => (can(hasPermission, 'magazines.view-any') || can(hasPermission, 'magazines.view-own')) && !userHasRole(user, 'author') && !userHasRole(user, 'sub_editor') && !userHasRole(user, 'reviewer') && !userHasRole(user, 'journal_editor'),
      },
      {
        label: 'Journals',
        href: '/admin/journals',
        icon: NotebookTabs,
        isVisible: ({ user, hasPermission }) => (can(hasPermission, 'magazines.view-any') || can(hasPermission, 'magazines.view-own')) && !userHasRole(user, 'author') && !userHasRole(user, 'sub_editor') && !userHasRole(user, 'reviewer') && !userHasRole(user, 'magazine_editor'),
      },
      {
        label: 'Shared Pages',
        href: '/admin/shared-pages',
        icon: Files,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) && can(hasPermission, 'shared_pages.manage'),
      },
      {
        label: 'Issue Manager',
        href: '/admin/issues',
        icon: CalendarRange,
        isVisible: ({ user }) => hasAnyRole(user, ['super_admin', 'publisher']),
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
        icon: UserRound,
        isVisible: ({ user, impersonationStatus }) => userHasRole(user, 'super_admin') && !impersonationStatus?.active,
      },
      {
        label: 'Roles & Permissions',
        href: '/admin/user-management/roles-permissions',
        icon: ShieldCheck,
        isVisible: ({ user, hasPermission, impersonationStatus }) => userHasRole(user, 'super_admin') && !impersonationStatus?.active && can(hasPermission, 'roles.view-any'),
      },
    ],
  },
  {
    group: 'Public Content',
    items: [
      {
        label: 'Advertising Management',
        href: '/admin/advertisements',
        icon: Megaphone,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) && can(hasPermission, 'advertisements.manage'),
      },
      {
        label: 'FAQ Management',
        href: '/admin/cms/faqs',
        icon: CircleHelp,
        isVisible: ({ hasPermission }) => can(hasPermission, 'settings.view-any') || can(hasPermission, 'settings.manage') || can(hasPermission, 'footer.manage'),
      },
      {
        label: 'Footer Content',
        href: '/admin/footer-cms',
        icon: PanelBottom,
        isVisible: ({ hasPermission }) => can(hasPermission, 'footer.manage') || can(hasPermission, 'settings.manage'),
      },
      {
        label: 'Contact Settings',
        href: '/admin/contact-settings',
        icon: AtSign,
        isVisible: ({ hasPermission }) => can(hasPermission, 'settings.view-any') || can(hasPermission, 'settings.manage') || can(hasPermission, 'footer.manage'),
      },
      {
        label: 'Contact Messages',
        href: '/admin/contact-messages',
        icon: Inbox,
        isVisible: ({ hasPermission }) => can(hasPermission, 'settings.view-any') || can(hasPermission, 'settings.manage') || can(hasPermission, 'footer.manage'),
      },
      {
        label: 'Newsletter',
        href: '/admin/newsletter',
        icon: Send,
        isVisible: ({ hasPermission }) => can(hasPermission, 'newsletters.view-any'),
      },
      {
        label: 'Support Tickets',
        href: '/admin/support-tickets',
        icon: TicketCheck,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) || can(hasPermission, 'support_ticket_management'),
      },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'My Account', href: '/admin/settings', icon: CircleUserRound },
      { label: 'Notification Preferences', href: '/admin/settings/notifications', icon: Bell },
      { label: 'Support', href: '/admin/support', icon: Headset },
    ],
  },
  {
    group: 'System Settings',
    items: [
      {
        label: 'Registration Settings',
        href: '/admin/user-management/registration-settings',
        icon: UserPlus,
        isVisible: ({ user, impersonationStatus }) => userHasRole(user, 'super_admin') && !impersonationStatus?.active,
      },
      {
        label: 'Article Types',
        href: '/admin/settings/types',
        icon: Shapes,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) || can(hasPermission, 'settings.manage'),
      },
      {
        label: 'Reviewer Questionnaire',
        href: '/admin/settings/review-questionnaire',
        icon: ListChecks,
        isVisible: ({ user, impersonationStatus }) => userHasRole(user, 'super_admin') && !impersonationStatus?.active,
      },
      {
        label: 'Categories',
        href: '/admin/settings/categories',
        icon: FolderTree,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) || can(hasPermission, 'settings.manage'),
      },
      {
        label: 'Subject Areas',
        href: '/admin/settings/subject-areas',
        icon: Microscope,
        isVisible: ({ user, hasPermission }) => hasAnyRole(user, ['super_admin', 'admin']) || can(hasPermission, 'settings.manage'),
      },
      {
        label: 'Languages',
        href: '/admin/settings/languages',
        icon: Languages,
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

export function getConsolePageTitle(pathname, visibleItems = []) {
  if (!pathname || pathname === '/admin') return 'Dashboard';

  const exactTitles = {
    '/admin/advertisements': 'Advertising Management',
    '/admin/advertisements/create': 'Create Advertisement',
    '/admin/articles/new': 'New Submission',
    '/admin/cms/faqs': 'FAQ Management',
    '/admin/magazines/tags': 'Magazine Tags',
    '/admin/rbac': 'Roles & Permissions',
    '/admin/search-results': 'Search Results',
    '/admin/support/new': 'New Support Ticket',
    '/admin/notifications': 'Notifications',
    '/admin/settings/notifications': 'Notification Preferences',
    '/admin/users/create': 'Create User',
  };
  if (exactTitles[pathname]) return exactTitles[pathname];

  if (/^\/admin\/advertisements\/[^/]+\/edit$/.test(pathname)) return 'Edit Advertisement';
  if (/^\/admin\/advertisements\/[^/]+$/.test(pathname)) return 'Advertisement Details';
  if (/^\/admin\/articles\/[^/]+\/workflow$/.test(pathname)) return 'Manuscript Workflow';
  if (/^\/admin\/articles\/[^/]+\/edit$/.test(pathname)) return 'Edit Manuscript';
  if (/^\/admin\/users\/[^/]+\/edit$/.test(pathname)) return 'Edit User';
  if (/^\/admin\/magazines\/[^/]+\/pages$/.test(pathname)) return 'Publication Pages';
  if (/^\/admin\/support\/[^/]+$/.test(pathname)) return 'Support Ticket Chat';
  if (/^\/admin\/support-tickets\/[^/]+$/.test(pathname)) return 'Review Support Ticket';
  if (/^\/admin\/cms\/[^/]+$/.test(pathname)) {
    const slug = pathname.split('/').at(-1);
    return `${slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} CMS`;
  }

  const allItems = [...visibleItems, ...flattenConsoleNavigation(consoleNavigation)];
  const navMatch = [...allItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)));

  return navMatch?.label || 'Admin Console';
}
