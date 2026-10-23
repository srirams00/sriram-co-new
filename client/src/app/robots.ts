import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sriramandco.in').replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shop',
          '/category/',
          '/product/',
          '/about',
          '/contact',
          '/terms',
          '/privacy',
          '/refund-policy',
          '/shipping-policy',
          '/warranty-policy',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/admin/*',
          '/f0d06b7799107f8da21a05984c29bb10',
          '/f0d06b7799107f8da21a05984c29bb10/*',
          '/account',
          '/account/*',
          '/checkout',
          '/checkout/*',
          '/cart',
          '/orders',
          '/orders/*',
          '/login',
          '/register',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
