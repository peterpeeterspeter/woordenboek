import { LETTERS } from '../../../lib/dictionary';

export async function GET() {
  const base = 'https://www.woordenboek.org';
  const today = new Date().toISOString().split('T')[0];

  // Letter sub-sitemaps (word pages)
  const letterEntries = LETTERS.map(
    (l) => `  <sitemap>
    <loc>${base}/sitemap-${l}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  ).join('\n');

  // Core pages sitemap (browse pages, homepage, static pages)
  const coreEntry = `  <sitemap>
    <loc>${base}/sitemap-core.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${coreEntry}
${letterEntries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
