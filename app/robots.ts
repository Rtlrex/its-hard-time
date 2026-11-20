import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/thank-you'] }],
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
    host: siteUrl.host,
  }
}
