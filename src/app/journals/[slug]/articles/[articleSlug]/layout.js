import { getArticleMetadata } from '../../../../../utils/serverMetadata';

export async function generateMetadata({ params }) {
  const { articleSlug } = await params;
  return getArticleMetadata(articleSlug, true);
}

export default function RouteTitleLayout({ children }) {
  return children;
}
