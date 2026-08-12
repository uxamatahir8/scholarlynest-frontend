import { getPublicationMetadata } from '../../../../utils/serverMetadata';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return getPublicationMetadata('magazines', slug, 'contents');
}

export default function RouteTitleLayout({ children }) {
  return children;
}
