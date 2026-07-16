import { redirect } from 'next/navigation';
import { getPublicationMetadata } from '../../../utils/serverMetadata';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return getPublicationMetadata('journals', slug, 'detail');
}

export default async function JournalIndexRedirect({ params }) {
  const resolvedParams = await params;
  redirect(`/journals/${resolvedParams.slug}/about-and-overview`);
}
