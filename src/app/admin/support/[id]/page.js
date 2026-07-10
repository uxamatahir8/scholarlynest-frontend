import SupportTicketWorkspace from '../../../../components/admin/support/SupportTicketWorkspace';

export default async function SupportTicketDetailPage({ params }) {
  const { id } = await params;
  return <SupportTicketWorkspace mode="detail" ticketId={id} />;
}
