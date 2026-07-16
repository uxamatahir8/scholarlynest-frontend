import AdvertisementWorkspace from '../../../../../components/admin/advertising/AdvertisementWorkspace';
export default async function EditAdvertisementPage({ params }) { const { id } = await params; return <AdvertisementWorkspace initialId={id} />; }
