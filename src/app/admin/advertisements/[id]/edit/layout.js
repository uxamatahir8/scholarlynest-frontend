export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Edit Advertisement #${id} | ScholarlyNest` };
}

export default function RouteTitleLayout({ children }) {
  return children;
}
