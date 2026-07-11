import React from 'react';
import { MessageSquareText } from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import WorkflowSection from './WorkflowSection';
import { labelize } from './workflowDisplay';

export default function ReviewRecommendationPanel({ article, canSeeReviewerIdentity }) {
  const recommendations = [];

  (article.sub_editor_assignments || []).forEach((assignment) => {
    if (assignment.recommendation || assignment.comments) {
      recommendations.push({
        key: `sub-${assignment.id}`,
        title: 'Sub Editor recommendation',
        actor: assignment.sub_editor?.name || 'Assigned Sub Editor',
        recommendation: assignment.recommendation,
        comments: assignment.comments,
      });
    }
  });

  (article.reviewer_assignments || []).forEach((assignment, index) => {
    if (assignment.recommendation || assignment.comments_for_author) {
      recommendations.push({
        key: `reviewer-${assignment.id}`,
        title: 'Reviewer recommendation',
        actor: canSeeReviewerIdentity ? assignment.invitee_name || assignment.reviewer?.name || 'Assigned reviewer' : `Reviewer ${index + 1}`,
        recommendation: assignment.recommendation,
        comments: assignment.comments_for_author,
        questionnaire: assignment.questionnaire_instance,
        submittedAt: assignment.questionnaire_instance?.submitted_at || assignment.completed_at,
      });
    }
  });

  (article.editorial_decisions || []).forEach((decision) => {
    recommendations.push({
      key: `decision-${decision.id}`,
      title: 'Editorial decision',
      actor: decision.decider?.name || 'Editorial team',
      recommendation: decision.decision,
      comments: decision.comments_for_author,
      internal: decision.internal_notes,
    });
  });

  return (
    <WorkflowSection title="Review Context" description="Recommendations and decisions visible to your role." icon={MessageSquareText}>
      {recommendations.length === 0 ? (
        <EmptyState title="No visible recommendations">Review notes and recommendations will appear here when permitted.</EmptyState>
      ) : (
        <ul className="min-w-0 space-y-3">
          {recommendations.map((item) => (
            <li key={item.key} className="min-w-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)]">{item.title}</p>
                  <p className="truncate text-xs font-semibold text-[var(--muted)]" title={item.actor}>{item.actor}</p>
                </div>
                {item.recommendation && (
                  <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--foreground)]">
                    {labelize(item.recommendation)}
                  </span>
                )}
              </div>
              {item.comments && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--foreground)]">{item.comments}</p>}
              {item.submittedAt && <p className="mt-2 text-xs font-medium text-[var(--muted)]">Submitted {new Date(item.submittedAt).toLocaleString()}</p>}
              {item.questionnaire?.questions?.length > 0 && (
                <div className="mt-3 min-w-0 overflow-hidden rounded-md bg-[var(--surface)] p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Questionnaire responses</p>
                  <dl className="space-y-2">
                    {item.questionnaire.questions.map((question) => (
                      <div key={question.id} className="min-w-0">
                        <dt className="break-words text-xs font-bold text-[var(--foreground)]">{question.prompt}</dt>
                        <dd className="break-words text-sm text-[var(--muted)]">{(() => {
                          const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
                          return answers.filter(Boolean).map((answer) => question.options?.find((option) => option.value === answer)?.label || labelize(answer)).join(', ') || 'No response';
                        })()}</dd>
                        {question.comment && <dd className="mt-1 whitespace-pre-wrap break-words rounded-md border-l-2 border-amber-500 bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)]">{question.comment}</dd>}
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {item.internal && <p className="mt-3 rounded-md bg-[var(--surface)] p-3 text-sm leading-relaxed text-[var(--muted)] break-words">Internal note: {item.internal}</p>}
            </li>
          ))}
        </ul>
      )}
    </WorkflowSection>
  );
}
