import Storefront, { type StoreProduct, type StoreCollection, type CartLine } from '@/components/storefront'
import { cookies } from 'next/headers'

const query = `query StorefrontHome {
  products(first: 16, sortKey: UPDATED_AT, reverse: true) {
    nodes {
      id title handle description productType tags availableForSale
      featuredImage { url altText width height }
      priceRange { minVariantPrice { amount currencyCode } }
      variants(first: 1) { nodes { id title availableForSale } }
    }
  }
  collections(first: 8) {
    nodes { id title handle image { url altText width height } }
  }
}`

async function getStorefrontData() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  if (!domain || !token) return { products: [], collections: [] }

  try {
    const response = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 300 },
    })
    if (!response.ok) return { products: [], collections: [] }
    const result = await response.json()
    return {
      products: (result.data?.products?.nodes ?? []) as StoreProduct[],
      collections: ((result.data?.collections?.nodes ?? []) as StoreCollection[]).filter((collection) => collection.handle !== 'frontpage'),
    }
  } catch {
    return { products: [], collections: [] }
  }
}

export default async function Page() {
  const [{ products, collections }, cookieStore] = await Promise.all([getStorefrontData(), cookies()])
  const cartId = cookieStore.get('northline_cart')?.value
  let initialCart: CartLine[] = []
  let initialCheckoutUrl = ''
  if (cartId && process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    try {
      const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN },
        body: JSON.stringify({ query: `query Cart($id: ID!) { cart(id: $id) { checkoutUrl lines(first: 30) { nodes { id quantity merchandise { ... on ProductVariant { id } } } } } }`, variables: { id: cartId } }),
        cache: 'no-store',
      })
      const result = await response.json()
      initialCart = (result.data?.cart?.lines?.nodes ?? []).map((line: { id: string; merchandise: { id: string }; quantity: number }) => ({ id: line.id, merchandiseId: line.merchandise.id, quantity: line.quantity }))
      initialCheckoutUrl = result.data?.cart?.checkoutUrl ?? ''
    } catch { /* An expired Shopify cart starts empty. */ }
  }
  return <Storefront products={products} collections={collections} storeDomain={process.env.SHOPIFY_STORE_DOMAIN ?? ''} initialCart={initialCart} initialCheckoutUrl={initialCheckoutUrl} />
}
