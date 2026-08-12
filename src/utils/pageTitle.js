export const SITE_NAME = 'ScholarlyNest';

const SITE_SUFFIX = /\s*(?:\||—|–|-)\s*ScholarlyNest\s*$/i;

export const normalizePageName = (value, fallback = 'Home') => {
  const text = String(value || '').trim().replace(SITE_SUFFIX, '').trim();
  return text || fallback;
};

export const formatPageTitle = (pageName, fallback = 'Home') => (
  `${normalizePageName(pageName, fallback)} | ${SITE_NAME}`
);

export const humanizeRouteSegment = (value, fallback = 'Page') => {
  const decoded = decodeURIComponent(String(value || '')).replace(/[-_]+/g, ' ').trim();
  if (!decoded) return fallback;
  return decoded.replace(/\b\w/g, (letter) => letter.toUpperCase());
};
