import React from 'react';
import { FileText } from 'lucide-react';
import WorkflowSection from './WorkflowSection';
import { formatDate, labelize } from './workflowDisplay';

export default function ArticleMetadataPanel({ article }) {
  const authors = article.article_authors?.length
    ? article.article_authors.map((author) => author.co_author_name).filter(Boolean).join(', ')
    : article.user?.name;

  const items = [
    ['Journal', article.magazine?.title || 'Not assigned'],
    ['Article type', article.article_type ? labelize(article.article_type) : 'Not recorded'],
    ['Subject area', article.subject_area || 'Not recorded'],
    ['Language', article.language || 'Not recorded'],
    ['Authors', authors || 'Not recorded'],
    ['Submitted', formatDate(article.created_at)],
    ['DOI', article.doi || 'Not recorded'],
    ['Issue', article.issue ? `${article.issue.special_title || 'Issue'} ${article.issue.volume_number || ''}/${article.issue.issue_number || ''}` : 'Not assigned'],
    ['Publication', article.published_month || article.published_year ? `${article.published_month || ''} ${article.published_year || ''}`.trim() : 'Not published'],
    ['Pages', article.page_start || article.page_end ? `${article.page_start || '?'}-${article.page_end || '?'}` : 'Not recorded'],
  ];

  return (
    <WorkflowSection title="Manuscript Information" description="Core bibliographic and publication context." icon={FileText}>
      <dl className="grid gap-4 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-[var(--foreground)]">{value}</dd>
          </div>
        ))}
      </dl>
      {article.abstract && (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Abstract</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">{article.abstract}</p>
        </div>
      )}
    </WorkflowSection>
  );
}
