import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/customers', '/reservations', '/booking'],
    },
    sitemap: 'https://as-works-sigma.vercel.app/sitemap.xml',
  };
}