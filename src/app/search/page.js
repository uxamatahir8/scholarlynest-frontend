import SearchPageClient from './SearchPageClient';

export async function generateMetadata({ searchParams }) {
  const query = String((await searchParams)?.q || '').trim();
  return { title: query ? `Search: ${query}` : 'Search' };
}

export default function SearchPage() {
  return <SearchPageClient />;
}
