export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Edit User #${id} | ScholarlyNest` };
}

export default function RouteTitleLayout({ children }) {
  return children;
}
