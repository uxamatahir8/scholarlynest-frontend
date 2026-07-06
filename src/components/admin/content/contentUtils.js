export const cmsPageDetails = {
  terms: {
    name: 'Terms of Service',
    description: 'Public platform terms and open access usage guidance.',
    publicHref: '/terms',
  },
  privacy: {
    name: 'Privacy Policy',
    description: 'Public privacy and manuscript-data handling policy.',
    publicHref: '/privacy',
  },
  manifests: {
    name: 'Metadata Manifests',
    description: 'Public metadata and indexing guidance.',
    publicHref: '/manifests',
  },
  'editorial-board': {
    name: 'Editorial Board',
    description: 'Public editorial board and governance content.',
    publicHref: '/editorial-board',
  },
};

export function formatDate(value) {
  if (!value) return 'Not recorded';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Not recorded';
  }
}

export function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function slugFromTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
