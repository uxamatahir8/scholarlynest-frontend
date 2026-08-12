export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Advertisement #${id} | ScholarlyNest` };
}

export default function RouteTitleLayout({ children }) {
  return children;
}
