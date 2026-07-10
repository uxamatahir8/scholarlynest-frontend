export function publicArticlePath(article, fallbackSlug = '') {
  const articleSlug = article?.slug || fallbackSlug;
  if (!articleSlug) return '/articles';

  const magazineSlug = article?.magazine?.slug || article?.magazine_slug;
  if (magazineSlug) {
    return `/magazines/${magazineSlug}/articles/${articleSlug}`;
  }

  return `/articles/${articleSlug}`;
}
