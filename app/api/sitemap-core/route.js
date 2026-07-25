import { LETTERS } from '../../../lib/dictionary';

// Core sitemap contents only change when a deployment changes these routes.
export const revalidate = false;

export async function GET() {
  const base = 'https://www.woordenboek.org';

  const urls = [
    // Homepage
    `  <url>
    <loc>${base}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    // Static pages
    `  <url>
    <loc>${base}/over</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
    `  <url>
    <loc>${base}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
    `  <url>
    <loc>${base}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`,
    `  <url>
    <loc>${base}/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`,
    `  <url>
    <loc>${base}/cookies</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`,
  ];

  // Letter browse pages. Paginated ?p=2+ pages are noindex,follow and omitted from the sitemap.
  for (const letter of LETTERS) {
    urls.push(`  <url>
    <loc>${base}/letter/${letter}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400',
    },
  });
}
