'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MagazineIndexRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  useEffect(() => {
    if (slug) {
      router.replace(`/magazines/${slug}/about-and-overview`);
    }
  }, [router, slug]);

  return null;
}
