import { headers } from 'next/headers'

export async function getSiteUrl() {
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get('x-forwarded-host')?.split(',')[0].trim()
  const requestHost = forwardedHost || requestHeaders.get('host')
  const configuredHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || process.env.SHOPIFY_STORE_DOMAIN
  const host = requestHost || configuredHost
  if (!host) return new URL('http://localhost:3000')

  const forwardedProtocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0].trim()
  const protocol = forwardedProtocol || (host.includes('localhost') ? 'http' : 'https')
  const normalizedHost = host.startsWith('https://') ? host.slice(8) : host.startsWith('http://') ? host.slice(7) : host
  return new URL(`${protocol}://${normalizedHost}`)
}
