export const normalizePublicationType = (type) => type === 'journal' ? 'journal' : 'magazine';

export const getPublicationRoutePrefix = (type) => normalizePublicationType(type) === 'journal' ? 'journals' : 'magazines';

export const getPublicationLabel = (type, plural = false) => {
  const label = normalizePublicationType(type) === 'journal' ? 'Journal' : 'Magazine';
  return plural ? `${label}s` : label;
};

export const getArticlePublicUrl = (article, fallbackSlug = '') => {
  const articleSlug = article?.slug || fallbackSlug;
  if (!articleSlug) return '/articles';
  const publication = article?.magazine || article?.publication;
  const publicationSlug = publication?.slug || article?.magazine_slug || article?.publication_slug;
  if (!publicationSlug) return `/articles/${articleSlug}`;
  const type = article?.publication_type || publication?.publication_type;
  return `/${getPublicationRoutePrefix(type)}/${publicationSlug}/articles/${articleSlug}`;
};
