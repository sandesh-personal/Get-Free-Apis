import type { MetadataRoute } from 'next';
import { collections, getAllApis, getAllCategories, stats } from '@/lib/apis';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(stats.generatedAt);

  const staticPages: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: 'daily', priority: 1 },
    { url: `${site.url}/browse`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site.url}/categories`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/collections`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/status`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${site.url}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${site.url}/editorial-policy`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${site.url}/contact`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${site.url}/submit`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${site.url}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/disclaimer`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPages.map((entry) => ({
    ...entry,
    lastModified: updated,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = getAllCategories().map((category) => ({
    url: `${site.url}/categories/${category.slug}`,
    lastModified: updated,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${site.url}/collections/${collection.slug}`,
    lastModified: updated,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const apiRoutes: MetadataRoute.Sitemap = getAllApis().map((api) => ({
    url: `${site.url}/apis/${api.id}`,
    lastModified: updated,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...collectionRoutes, ...apiRoutes];
}
