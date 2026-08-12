import DirectPublicationEditor from '../../../../components/admin/publication/DirectPublicationEditor';
export default async function DirectPublicationPage({ params }) { const { id } = await params; return <DirectPublicationEditor articleId={id} />; }
