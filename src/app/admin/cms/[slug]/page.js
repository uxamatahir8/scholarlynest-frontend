import CmsPageWorkspace from '../../../../components/admin/content/CmsPageWorkspace';

export default async function AdminCmsPage({ params }) {
  const { slug } = await params;
  return <CmsPageWorkspace slug={slug} />;
}
