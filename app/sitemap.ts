import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: new URL('/', siteUrl).toString(), lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: new URL('/privacy', siteUrl).toString(), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: new URL('/terms', siteUrl).toString(), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  if (!domain || !token) return staticRoutes

  try {
    const response = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
      body: JSON.stringify({ query: `query SitemapProducts { products(first: 250) { nodes { handle updatedAt } } }` }),
      next: { revalidate: 3600 },
    })
    if (!response.ok) return staticRoutes
    const result = await response.json()
    const products = result.data?.products?.nodes ?? []
    return [
      ...staticRoutes,
      ...products.map((product: { handle: string; updatedAt: string }) => ({
        url: new URL(`/products/${encodeURIComponent(product.handle)}`, siteUrl).toString(),
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch {
    return staticRoutes
  }
}
