import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    const domain = process.env.SHOPIFY_STORE_DOMAIN
    const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
    if (!domain || !token) return NextResponse.json({ error: 'Signups are temporarily unavailable.' }, { status: 503 })
    const response = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
      body: JSON.stringify({ query: `mutation Subscribe($input: CustomerCreateInput!) { customerCreate(input: $input) { customer { id } customerUserErrors { field message } } }`, variables: { input: { email, acceptsMarketing: true } } }),
      cache: 'no-store',
    })
    const result = await response.json()
    const errors = result.data?.customerCreate?.customerUserErrors ?? []
    if (!response.ok || result.errors?.length || errors.length) return NextResponse.json({ error: errors[0]?.message || 'Unable to subscribe right now. Please try again later.' }, { status: 400 })
    return NextResponse.json({ subscribed: true })
  } catch {
    return NextResponse.json({ error: 'Unable to subscribe right now. Please try again later.' }, { status: 502 })
  }
}
