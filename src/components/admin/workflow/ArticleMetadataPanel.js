import React from 'react';
import { FileText } from 'lucide-react';
import WorkflowSection from './WorkflowSection';
import { formatDate, labelize } from './workflowDisplay';

export default function ArticleMetadataPanel({ article }) {
  const items = [
    ['Magazine', article.magazine?.title || 'Not assigned'],
    ['Current status', article.author_status || article.status || 'Not recorded'],
    ['Internal tracking code', article.tracking_code || 'Not recorded'],
    ['Article type', article.article_type ? labelize(article.article_type) : 'Not recorded'],
    ['Classification', article.article_category || 'Not recorded'],
    ['Subject area', article.subject_area || 'Not recorded'],
    ['Language', article.language || 'Not recorded'],
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
      {(article.article_authors || []).length > 0 && (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Authors and Affiliations</h3>
          <ul className="mt-3 grid gap-3">
            {article.article_authors.map((author) => (
              <li key={author.id || author.co_author_email || author.co_author_name} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="text-sm font-bold text-[var(--foreground)]">{author.co_author_name}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                  {[author.affiliation || author.university_name, author.department, author.country, author.orcid ? `ORCID ${author.orcid}` : null].filter(Boolean).join(' · ') || 'Affiliation not recorded'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {article.abstract && (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Abstract</h3>
          <div
            className="prose prose-sm mt-2 max-w-none break-words text-sm leading-relaxed text-[var(--foreground)] dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: article.abstract }}
          />
        </div>
      )}
      {(article.keywords || []).length > 0 && (
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Keywords</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {article.keywords.map((keyword) => <span key={keyword} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-bold">{keyword}</span>)}
          </div>
        </div>
      )}
      {[
        ['Ethical Approval', article.ethical_approval_statement],
        ['Conflict of Interest', article.conflict_of_interest_statement],
        ['Funding', article.funding_statement],
        ['Data Availability', article.data_availability_statement],
        ['Author Contributions', article.author_contribution_statement],
      ].some(([, value]) => value) && (
        <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 md:grid-cols-2">
          {[
            ['Ethical Approval', article.ethical_approval_statement],
            ['Conflict of Interest', article.conflict_of_interest_statement],
            ['Funding', article.funding_statement],
            ['Data Availability', article.data_availability_statement],
            ['Author Contributions', article.author_contribution_statement],
          ].filter(([, value]) => value).map(([label, value]) => (
            <div key={label}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[var(--foreground)]">{value}</p>
            </div>
          ))}
        </div>
      )}
    </WorkflowSection>
  );
}
