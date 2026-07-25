import { getDefinedWordsForLetter, getDictData, LETTERS } from '../../../../lib/dictionary';

// The dictionary only changes when a new deployment ships updated data files.
// Keep this generated sitemap cached until that deployment instead of rebuilding it daily.
export const revalidate = false;
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return LETTERS.map((letter) => ({ letter }));
}

export async function GET(request, { params }) {
  const l = params.letter?.toLowerCase();
  if (!l || !LETTERS.includes(l)) {
    return new Response('Not found', { status: 404 });
  }

  const words = getDefinedWordsForLetter(l);
  const dictData = getDictData(l);
  const base = 'https://www.woordenboek.org';

  const urls = words
    .flatMap((w) => {
      const entry = dictData[w.toLowerCase()] || dictData[w];
      const pages = [
        // Always include betekenis page
        `  <url>
    <loc>${base}/betekenis/${encodeURIComponent(w)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
      ];

      // Add synoniem page if word has synonyms
      if (entry?.y?.length > 0) {
        pages.push(
          `  <url>
    <loc>${base}/synoniem/${encodeURIComponent(w)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
        );
      }

      // Add vertaling page if word has English translation
      if (entry?.tr?.en?.length > 0) {
        pages.push(
          `  <url>
    <loc>${base}/vertaling/nederlands-engels/${encodeURIComponent(w)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
        );
      }

      return pages;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400',
    },
  });
}
