import { BookOpen, ClipboardCheck, FileText, Newspaper, Settings, Users } from 'lucide-react';

export const completedAssignmentStatuses = new Set(['completed']);

export function articleQueueItem(article, actionLabel = 'Open Article') {
  return {
    id: article.id,
    title: article.title,
    status: article.author_status || article.status,
    context: article.magazine?.title || article.user?.name || 'Manuscript record',
    href: article.id ? `/admin/articles/${article.id}/workflow` : '/admin/articles',
    actionLabel,
  };
}

export function assignmentQueueItem(assignment, actionLabel = 'Open Task') {
  const article = assignment.article || {};
  return {
    id: assignment.id,
    title: article.title,
    status: assignment.status || article.status,
    context: article.magazine?.title || 'Assigned manuscript',
    dueDate: assignment.due_date,
    href: article.id ? `/admin/articles/${article.id}/workflow` : undefined,
    actionLabel,
  };
}

export function publicationQueueItem(article, actionLabel = 'Open Publishing') {
  const issue = article.issue;
  const issueLabel = issue
    ? [issue.volume_number ? `Vol. ${issue.volume_number}` : null, issue.issue_number ? `Issue ${issue.issue_number}` : null].filter(Boolean).join(', ')
    : null;

  return {
    id: article.id,
    title: article.title,
    status: article.status,
    context: [article.magazine?.title, issueLabel].filter(Boolean).join(' / ') || 'Publication record',
    href: article.id ? `/admin/articles/${article.id}/workflow` : '/admin/publisher',
    actionLabel,
  };
}

export function validAdminLinks({ includeUsers = false, includeNewsletter = true } = {}) {
  return [
    includeUsers ? { label: 'Users', href: '/admin/users', icon: Users, description: 'Manage authorized console accounts.' } : null,
    { label: 'Articles', href: '/admin/articles', icon: FileText, description: 'Open the full manuscript queue.' },
    { label: 'Magazines', href: '/admin/magazines', icon: BookOpen, description: 'Review publication catalog records.' },
    { label: 'FAQ Management', href: '/admin/cms/faqs', icon: ClipboardCheck, description: 'Maintain public help content.' },
    includeNewsletter ? { label: 'Newsletter', href: '/admin/newsletter', icon: Newspaper, description: 'Review communications tools.' } : null,
    { label: 'Settings', href: '/admin/settings', icon: Settings, description: 'Manage your account and security.' },
  ].filter(Boolean);
}
