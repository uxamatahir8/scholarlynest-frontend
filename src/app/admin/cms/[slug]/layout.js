import { humanizeRouteSegment } from '../../../../utils/pageTitle';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${humanizeRouteSegment(slug)} CMS | ScholarlyNest` };
}

export default function RouteTitleLayout({ children }) {
  return children;
}
