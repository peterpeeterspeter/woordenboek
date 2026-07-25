/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,

  async redirects() {
    return [
      // Fix typo: /betkenis/* → /betekenis/*
      {
        source: '/betkenis/:path*',
        destination: '/betekenis/:path*',
        permanent: true, // 301
      },
    ];
  },

  async rewrites() {
    return [
      // Clean sitemap URLs for crawlers
      { source: '/sitemap.xml', destination: '/api/sitemap' },
      { source: '/sitemap-core.xml', destination: '/api/sitemap-core' },
      { source: '/sitemap-:letter.xml', destination: '/api/sitemap-letter/:letter' },
    ];
  },

};

module.exports = nextConfig;
