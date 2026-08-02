import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo-keywords';

const routes = [
  '',
  '/about',
  '/astrologers',
  '/book',
  '/contact',
  '/faq',
  '/privacy',
  '/services',
  '/shop',
  '/terms',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));
}
