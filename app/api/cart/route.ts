import { NextRequest, NextResponse } from 'next/server'

const cartQuery = `query CartDetails($id: ID!) {
  cart(id: $id) { id checkoutUrl lines(first: 30) { nodes { id quantity merchandise { ... on ProductVariant { id } } } } }
}`
const cartFields = `id checkoutUrl lines(first: 30) { nodes { id quantity merchandise { ... on ProductVariant { id } } } }`

async function shopify<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  if (!domain || !token) throw new Error('Shopify storefront is not configured.')
  const response = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query, variables }), cache: 'no-store',
  })
  const result = await response.json()
  if (!response.ok || result.errors?.length) throw new Error(result.errors?.[0]?.message || 'Shopify is temporarily unavailable.')
  return result.data
}

function cartResponse(data: { cart: { id: string; checkoutUrl: string; lines: { nodes: { id: string; quantity: number; merchandise: { id: string } }[] } | null } | null }, cookieId?: string) {
  if (!data.cart) return NextResponse.json({ error: 'This bag is no longer available. Please refresh and try again.' }, { status: 404 })
  const response = NextResponse.json({ checkoutUrl: data.cart.checkoutUrl, lines: (data.cart.lines?.nodes ?? []).map((line) => ({ id: line.id, merchandiseId: line.merchandise.id, quantity: line.quantity })) })
  response.cookies.set('northline_cart', cookieId || data.cart.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 14 })
  return response
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const merchandiseId = typeof body.merchandiseId === 'string' ? body.merchandiseId : ''
    const quantity = Number(body.quantity)
    if (!merchandiseId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return NextResponse.json({ error: 'Choose a valid piece and quantity.' }, { status: 400 })
    const cartId = request.cookies.get('northline_cart')?.value
    if (cartId) {
      const data = await shopify<{ cartLinesAdd: { cart: { id: string; checkoutUrl: string; lines: { nodes: { id: string; quantity: number; merchandise: { id: string } }[] } | null }; userErrors: { message: string }[] } }>(`mutation AddCartLine($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${cartFields} } userErrors { message } } }`, { cartId, lines: [{ merchandiseId, quantity }] })
      const result = data.cartLinesAdd
      if (result.userErrors.length) return NextResponse.json({ error: result.userErrors[0].message }, { status: 400 })
      return cartResponse({ cart: result.cart }, cartId)
    }
    const data = await shopify<{ cartCreate: { cart: { id: string; checkoutUrl: string; lines: { nodes: { id: string; quantity: number; merchandise: { id: string } }[] } | null }; userErrors: { message: string }[] } }>(`mutation CreateCart($input: CartInput!) { cartCreate(input: $input) { cart { ${cartFields} } userErrors { message } } }`, { input: { lines: [{ merchandiseId, quantity }] } })
    const result = data.cartCreate
    if (result.userErrors.length) return NextResponse.json({ error: result.userErrors[0].message }, { status: 400 })
    return cartResponse({ cart: result.cart })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update the bag.' }, { status: 502 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cartId = request.cookies.get('northline_cart')?.value
    const body = await request.json()
    const quantity = Number(body.quantity)
    if (!cartId || typeof body.merchandiseId !== 'string' || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return NextResponse.json({ error: 'Choose a valid quantity.' }, { status: 400 })
    const current = await shopify<{ cart: { lines: { nodes: { id: string; merchandise: { id: string } }[] } | null } }>(cartQuery, { id: cartId })
    const line = current.cart?.lines?.nodes.find((item) => item.merchandise.id === body.merchandiseId)
    if (!line) return NextResponse.json({ error: 'That piece is no longer in your bag.' }, { status: 404 })
    const updated = await shopify<{ cartLinesUpdate: { cart: { id: string; checkoutUrl: string; lines: { nodes: { id: string; quantity: number; merchandise: { id: string } }[] } | null }; userErrors: { message: string }[] } }>(`mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${cartFields} } userErrors { message } } }`, { cartId, lines: [{ id: line.id, quantity }] })
    if (updated.cartLinesUpdate.userErrors.length) return NextResponse.json({ error: updated.cartLinesUpdate.userErrors[0].message }, { status: 400 })
    return cartResponse({ cart: updated.cartLinesUpdate.cart }, cartId)
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update the bag.' }, { status: 502 }) }
}

export async function DELETE(request: NextRequest) {
  try {
    const cartId = request.cookies.get('northline_cart')?.value
    const body = await request.json()
    if (!cartId || typeof body.merchandiseId !== 'string') return NextResponse.json({ error: 'Choose a valid piece.' }, { status: 400 })
    const current = await shopify<{ cart: { lines: { nodes: { id: string; merchandise: { id: string } }[] } | null } }>(cartQuery, { id: cartId })
    const line = current.cart?.lines?.nodes.find((item) => item.merchandise.id === body.merchandiseId)
    if (!line) return NextResponse.json({ lines: [] })
    const updated = await shopify<{ cartLinesRemove: { cart: { id: string; checkoutUrl: string; lines: { nodes: { id: string; quantity: number; merchandise: { id: string } }[] } | null }; userErrors: { message: string }[] } }>(`mutation RemoveCartLine($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${cartFields} } userErrors { message } } }`, { cartId, lineIds: [line.id] })
    if (updated.cartLinesRemove.userErrors.length) return NextResponse.json({ error: updated.cartLinesRemove.userErrors[0].message }, { status: 400 })
    return cartResponse({ cart: updated.cartLinesRemove.cart }, cartId)
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update the bag.' }, { status: 502 }) }
}
