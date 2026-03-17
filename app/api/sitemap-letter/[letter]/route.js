import { getDefinedWordsForLetter, LETTERS } from '../../../../lib/dictionary';

export async function GET(request, { params }) {
  const l = params.letter?.toLowerCase();
  if (!l || !LETTERS.includes(l)) {
    return new Response('Not found', { status: 404 });
  }

  const words = getDefinedWordsForLetter(l);
  const base = 'https://woordenboek.org';
  const today = new Date().toISOString().split('T')[0];

  const urls = words
    .map(
      (w) => `  <url>
    <loc>${base}/betekenis/${encodeURIComponent(w)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
