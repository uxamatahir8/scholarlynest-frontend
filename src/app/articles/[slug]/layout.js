import { getArticleMetadata } from '../../../utils/serverMetadata';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return getArticleMetadata(slug);
}

export default function RouteTitleLayout({ children }) {
  return children;
}
