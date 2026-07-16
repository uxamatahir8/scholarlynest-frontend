export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Review Invitation #${id}` };
}

export default function RouteTitleLayout({ children }) {
  return children;
}
