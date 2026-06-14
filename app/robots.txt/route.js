export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /zoek/

Sitemap: https://www.woordenboek.org/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
