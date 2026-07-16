export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Workflow - Article #${id} | ScholarlyNest` };
}

export default function RouteTitleLayout({ children }) {
  return children;
}
