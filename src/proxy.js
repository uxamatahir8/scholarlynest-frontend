import { NextResponse } from 'next/server';

const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

export async function proxy(request) {
  if (!['GET', 'HEAD'].includes(request.method)) return NextResponse.next();

  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const prefix = segments[0];
  const publicationType = prefix === 'journals' ? 'journal' : prefix === 'magazines' ? 'magazine' : null;
  const publicationSlug = publicationType ? segments[1] : null;
  const articleIndex = segments.indexOf('articles');
  const articleSlug = articleIndex >= 0 ? segments[articleIndex + 1] : (prefix === 'articles' ? segments[1] : null);

  if ((!publicationType || !publicationSlug) && !articleSlug) return NextResponse.next();

  const query = new URLSearchParams();
  if (publicationType) query.set('publication_type', publicationType);
  if (publicationSlug) query.set('publication_slug', publicationSlug);
  if (articleSlug) query.set('article_slug', articleSlug);

  try {
    const response = await fetch(`${apiBase}/slugs/resolve?${query}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return NextResponse.next();
    const result = await response.json();
    if (!result.redirect_required || !result.canonical_path) return NextResponse.next();

    let canonicalPath = result.canonical_path;
    if (publicationType && !articleSlug && segments.length > 2) {
      canonicalPath += `/${segments.slice(2).join('/')}`;
    }
    const target = new URL(canonicalPath, request.url);
    target.search = request.nextUrl.search;
    if (target.pathname === request.nextUrl.pathname) return NextResponse.next();
    return NextResponse.redirect(target, 301);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/magazines/:path*', '/journals/:path*', '/articles/:path*'],
};
