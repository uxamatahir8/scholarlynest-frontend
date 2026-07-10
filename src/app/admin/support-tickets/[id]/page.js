import SupportTicketWorkspace from '../../../../components/admin/support/SupportTicketWorkspace';

export default async function SupportTicketManagementDetailPage({ params }) {
  const { id } = await params;
  return <SupportTicketWorkspace mode="detail" admin ticketId={id} />;
}
