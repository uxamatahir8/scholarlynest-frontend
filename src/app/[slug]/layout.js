import { getCmsPageMetadata } from '../../utils/serverMetadata';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return getCmsPageMetadata(slug);
}

export default function RouteTitleLayout({ children }) {
  return children;
}
