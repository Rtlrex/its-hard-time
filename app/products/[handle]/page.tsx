import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ProductDetail, { type DetailProduct } from '@/components/product-detail'

const productQuery = `query Product($handle: String!) { productByHandle(handle: $handle) { id title handle description productType availableForSale featuredImage { url altText width height } images(first: 8) { nodes { url altText width height } } priceRange { minVariantPrice { amount currencyCode } } variants(first: 30) { nodes { id title availableForSale selectedOptions { name value } price { amount currencyCode } } } } }`
type ProductResponse = { data?: { productByHandle?: DetailProduct | null } }

async function getProduct(handle: string): Promise<DetailProduct | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  if (!domain || !token) return null
  try {
    const response = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
      body: JSON.stringify({ query: productQuery, variables: { handle } }),
      next: { revalidate: 300 },
    })
    if (!response.ok) return null
    const result = await response.json() as ProductResponse
    return result.data?.productByHandle ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) return { title: 'Piece not found', description: 'This piece is no longer available in the NORTHLINE collection.' }
  const description = product.description.slice(0, 160).trim()
  return {
    title: product.title,
    description,
    openGraph: {
      title: `${product.title} | NORTHLINE`,
      description,
      images: [{ url: product.featuredImage?.url || '/og-northline.png', alt: product.featuredImage?.altText || product.title }],
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) notFound()
  return <main className="detail-page"><header className="detail-header"><Link href="/" className="detail-back"><ArrowLeft size={15} /> Back to Northline</Link><Link href="/" className="wordmark">NORTHLINE<span className="wordmark-mark">®</span></Link><span className="detail-label">FIELD EQUIPMENT / {product.productType || 'NORTHLINE'}</span></header><ProductDetail product={product} /></main>
}
