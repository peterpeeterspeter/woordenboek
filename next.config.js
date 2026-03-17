/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,

  async rewrites() {
    return [
      // Clean sitemap URLs for crawlers
      { source: '/sitemap.xml', destination: '/api/sitemap' },
      { source: '/sitemap-:letter.xml', destination: '/api/sitemap-letter/:letter' },
    ];
  },

  async headers() {
    return [
      {
        source: '/betekenis/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
