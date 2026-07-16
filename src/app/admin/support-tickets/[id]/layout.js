export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Review Support Ticket #${id} | ScholarlyNest` };
}

export default function RouteTitleLayout({ children }) {
  return children;
}
