'use client';

import { useParams } from 'next/navigation';
import ManuscriptForm from '../../../../../components/admin/manuscript-form/ManuscriptForm';

export default function EditManuscriptPage() {
  const params = useParams();
  return <ManuscriptForm mode="edit" articleId={params?.id} />;
}
