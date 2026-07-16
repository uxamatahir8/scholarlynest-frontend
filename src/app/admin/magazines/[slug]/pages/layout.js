import { humanizeRouteSegment } from '../../../../../utils/pageTitle';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `Publication Pages - ${humanizeRouteSegment(slug)} | ScholarlyNest` };
}

export default function RouteTitleLayout({ children }) {
  return children;
}
