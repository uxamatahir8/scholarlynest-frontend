import AdvertisementWorkspace from '../../../../components/admin/advertising/AdvertisementWorkspace';
export default async function AdvertisementPage({ params }) { const { id } = await params; return <AdvertisementWorkspace initialId={id} />; }
