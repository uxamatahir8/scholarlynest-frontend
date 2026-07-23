const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.scholarlynest.com').replace(/\/$/, '');
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

export default async function sitemap() {
  const staticEntries = ['', '/about', '/contact', '/magazines', '/journals'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  try {
    const response = await fetch(`${apiBase}/sitemap`, { next: { revalidate: 3600 } });
    if (!response.ok) return staticEntries;
    const payload = await response.json();
    const dynamicEntries = (payload.data || []).map((entry) => ({
      url: `${siteUrl}${entry.path}`,
      lastModified: entry.updated_at ? new Date(entry.updated_at) : new Date(),
    }));
    return [...staticEntries, ...dynamicEntries];
  } catch {
    return staticEntries;
  }
}
