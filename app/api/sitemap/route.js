import { LETTERS } from '../../../lib/dictionary';

export async function GET() {
  const base = 'https://woordenboek.org';
  const today = new Date().toISOString().split('T')[0];

  const entries = LETTERS.map(
    (l) => `  <sitemap>
    <loc>${base}/sitemap-${l}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
