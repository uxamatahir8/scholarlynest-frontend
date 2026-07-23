import ArticleDetail from '../../../../articles/[slug]/page';

const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.scholarlynest.com').replace(/\/$/, '');

async function articleMetadata(publicationSlug, articleSlug) {
  for (const prefix of ['magazines', 'journals']) {
    const response = await fetch(`${apiBase}/${prefix}/${publicationSlug}/articles/${articleSlug}`, { cache: 'no-store' });
    if (response.ok) return response.json();
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { slug, articleSlug } = await params;
  const payload = await articleMetadata(slug, articleSlug);
  const article = payload?.article;
  if (!article?.public_url) return { title: articleSlug };
  const canonical = `${siteUrl}${article.public_url}`;
  return {
    title: article.seo_title || article.title,
    description: article.seo_description,
    alternates: { canonical },
    openGraph: {
      title: article.seo_title || article.title,
      description: article.seo_description,
      url: canonical,
      type: 'article',
      images: article.og_image ? [article.og_image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seo_title || article.title,
      description: article.seo_description,
      images: article.og_image ? [article.og_image] : [],
    },
  };
}

export default ArticleDetail;
