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
        actor: canSeeReviewerIdentity ? assignment.reviewer?.name || 'Assigned reviewer' : `Reviewer ${index + 1}`,
        recommendation: assignment.recommendation,
        comments: assignment.comments_for_author,
        questionnaire: assignment.questionnaire_instance,
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
        <ul className="space-y-3">
          {recommendations.map((item) => (
            <li key={item.key} className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{item.title}</p>
                  <p className="text-xs font-semibold text-[var(--muted)]">{item.actor}</p>
                </div>
                {item.recommendation && (
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--foreground)]">
                    {labelize(item.recommendation)}
                  </span>
                )}
              </div>
              {item.comments && <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]">{item.comments}</p>}
              {item.questionnaire?.questions?.length > 0 && (
                <div className="mt-3 rounded-md bg-[var(--surface)] p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Questionnaire responses</p>
                  <dl className="space-y-2">
                    {item.questionnaire.questions.map((question) => (
                      <div key={question.id}>
                        <dt className="text-xs font-bold text-[var(--foreground)]">{question.prompt}</dt>
                        <dd className="text-sm text-[var(--muted)]">{Array.isArray(question.answer) ? question.answer.join(', ') : (question.answer || 'No response')}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {item.internal && <p className="mt-3 rounded-md bg-[var(--surface)] p-3 text-sm leading-relaxed text-[var(--muted)]">Internal note: {item.internal}</p>}
            </li>
          ))}
        </ul>
      )}
    </WorkflowSection>
  );
}
