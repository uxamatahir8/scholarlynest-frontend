import { getPublicationMetadata } from '../../../../utils/serverMetadata';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return getPublicationMetadata('journals', slug, 'contents');
}

export default function RouteTitleLayout({ children }) {
  return children;
}
