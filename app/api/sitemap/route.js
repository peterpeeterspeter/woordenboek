import { LETTERS } from '../../../lib/dictionary';

// Sitemap contents only change when a deployment updates the dictionary.
export const revalidate = false;

export async function GET() {
  const base = 'https://www.woordenboek.org';

  // Letter sub-sitemaps (word pages)
  const letterEntries = LETTERS.map(
    (l) => `  <sitemap>
    <loc>${base}/sitemap-${l}.xml</loc>
  </sitemap>`
  ).join('\n');

  // Core pages sitemap (browse pages, homepage, static pages)
  const coreEntry = `  <sitemap>
    <loc>${base}/sitemap-core.xml</loc>
  </sitemap>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${coreEntry}
${letterEntries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400',
    },
  });
}
