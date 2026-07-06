import { Suspense } from 'react';
import LoadingState from '../../../components/ui/LoadingState';
import IssueWorkspace from '../../../components/admin/publication/IssueWorkspace';

export default function AdminIssuesPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading issue workspace..." className="min-h-[420px]" />}>
      <IssueWorkspace />
    </Suspense>
  );
}
