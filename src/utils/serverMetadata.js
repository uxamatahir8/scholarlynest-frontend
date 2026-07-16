import { formatPageTitle, humanizeRouteSegment } from './pageTitle';
import { logWarn } from './safeLogger';
import api from './api';

export async function getPublicMetadataData(path) {
  try {
    const response = await api.get(path.startsWith('/') ? path : `/${path}`);
    return response.data;
  } catch (error) {
    logWarn('Unable to resolve dynamic page metadata', error?.message);
    return null;
  }
}

export async function getArticleMetadata(slug, includeSiteName = false) {
  const data = await getPublicMetadataData(`/articles/${slug}`);
  const title = data?.title || humanizeRouteSegment(slug, 'Article');
  return {
    title: includeSiteName ? formatPageTitle(title) : title,
  };
}

export async function getPublicationMetadata(routePrefix, slug, section = 'overview', pageSlug = '') {
  const publicationLabel = routePrefix === 'journals' ? 'Journal' : 'Magazine';
  const endpoint = section === 'page'
    ? `/${routePrefix}/${slug}/pages/${pageSlug}`
    : section === 'contents'
      ? `/${routePrefix}/${slug}/table-of-contents`
      : section === 'overview'
        ? `/${routePrefix}/${slug}/about-and-overview`
        : `/${routePrefix}/${slug}`;
  const data = await getPublicMetadataData(endpoint);
  const publication = data?.magazine || data;
  const publicationTitle = publication?.title || humanizeRouteSegment(slug, publicationLabel);

  if (section === 'page') {
    return { title: formatPageTitle(data?.page?.title ? `${data.page.title} - ${publicationTitle}` : `${publicationLabel} Page - ${publicationTitle}`) };
  }
  if (section === 'contents') return { title: formatPageTitle(`Table of Contents - ${publicationTitle}`) };
  return { title: formatPageTitle(`${publicationLabel} - ${publicationTitle}`) };
}

export async function getCmsPageMetadata(slug) {
  const data = await getPublicMetadataData(`/public/footer/pages/${slug}`);
  return { title: data?.title || humanizeRouteSegment(slug, 'Content Page') };
}
