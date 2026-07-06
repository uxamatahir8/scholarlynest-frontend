import React from 'react';
import { CheckCircle2, Circle, Clock3 } from 'lucide-react';
import WorkflowSection from './WorkflowSection';
import { currentMilestoneIndex, workflowMilestones } from './workflowDisplay';

export default function WorkflowContextPanel({ article }) {
  const activeIndex = currentMilestoneIndex(article.status);

  return (
    <WorkflowSection
      title="Workflow State"
      description="A concise view of where this manuscript sits now."
      icon={Clock3}
    >
      <ol className="grid gap-2" aria-label="Workflow milestones">
        {workflowMilestones.map((milestone, index) => {
          const active = index === activeIndex;
          const complete = index < activeIndex;
          const Icon = complete ? CheckCircle2 : Circle;
          return (
            <li
              key={milestone.id}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                active
                  ? 'border-[var(--accent)] bg-[var(--surface-muted)]'
                  : 'border-[var(--border)] bg-[var(--surface)]'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${complete ? 'text-emerald-600' : active ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} aria-hidden="true" />
              <span className="text-sm font-bold text-[var(--foreground)]">{milestone.label}</span>
              {active && <span className="ml-auto text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Current</span>}
            </li>
          );
        })}
      </ol>
    </WorkflowSection>
  );
}
