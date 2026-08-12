import SearchResultsPageClient from './SearchResultsPageClient';

export async function generateMetadata({ searchParams }) {
  const query = String((await searchParams)?.q || '').trim();
  return { title: query ? `Search: ${query}` : 'Search Results' };
}

export default function SearchResultsPage() {
  return <SearchResultsPageClient />;
}
