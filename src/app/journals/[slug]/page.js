import { redirect } from 'next/navigation';

export default async function JournalIndexRedirect({ params }) {
  const resolvedParams = await params;
  redirect(`/journals/${resolvedParams.slug}/about-and-overview`);
}
