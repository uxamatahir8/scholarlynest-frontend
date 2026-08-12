import { getPublicationMetadata } from '../../../../utils/serverMetadata';

export async function generateMetadata({ params }) {
  const { slug, pageSlug } = await params;
  return getPublicationMetadata('journals', slug, 'page', pageSlug);
}

export default function RouteTitleLayout({ children }) {
  return children;
}
