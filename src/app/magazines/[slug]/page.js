import { redirect } from 'next/navigation';
import { getPublicationMetadata } from '../../../utils/serverMetadata';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return getPublicationMetadata('magazines', slug, 'detail');
}

export default async function MagazineIndexRedirect({ params }) {
  const resolvedParams = await params;
  redirect(`/magazines/${resolvedParams.slug}/about-and-overview`);
}
