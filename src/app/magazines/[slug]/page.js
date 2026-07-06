import { redirect } from 'next/navigation';

export default async function MagazineIndexRedirect({ params }) {
  const resolvedParams = await params;
  redirect(`/magazines/${resolvedParams.slug}/about-and-overview`);
}
