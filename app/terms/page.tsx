import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Read the terms for browsing and shopping the NORTHLINE storefront.',
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <main className="policy-page">
      <header className="policy-header"><Link className="wordmark" href="/">NORTHLINE<span className="wordmark-mark">®</span></Link><Link className="policy-back" href="/">Back to the store</Link></header>
      <article className="policy-content">
        <p className="eyebrow">NORTHLINE / THE DETAILS</p>
        <h1>Terms &amp; <em>conditions.</em></h1>
        <p className="policy-updated">Last updated: November 20, 2026</p>
        <p>These terms apply when you browse this storefront. By placing an order, you also agree to the checkout, shipping, and return terms presented by Shopify and the merchant before purchase.</p>
        <h2>Products and availability</h2>
        <p>Product descriptions, images, prices, and availability are supplied by the Shopify catalog and may change. An item is not reserved until checkout confirms your order. If a catalog or pricing error affects an order, the merchant will contact you before fulfilling it.</p>
        <h2>Orders and payment</h2>
        <p>Checkout and payment are processed securely by Shopify and its supported payment providers. The order confirmation and any order-specific terms shown at checkout govern your purchase.</p>
        <h2>Shipping, returns, and support</h2>
        <p>Shipping estimates, return eligibility, and any applicable fees are displayed by the merchant or at checkout. Review those details before placing an order. For order questions, use the merchant&apos;s published contact details in your Shopify order confirmation.</p>
        <h2>Acceptable use</h2>
        <p>Do not misuse the storefront, attempt to disrupt its operation, or use it to violate another person&apos;s rights or applicable law. Product text, campaign imagery, and NORTHLINE branding may not be reused without permission.</p>
        <h2>Changes and governing terms</h2>
        <p>These terms may be updated as the store changes. The applicable law and any additional merchant-specific terms are the ones disclosed by the merchant at checkout.</p>
        <div className="policy-callout liquid-glass glass-smoked">Order-specific details at Shopify checkout take precedence over this general storefront summary.</div>
      </article>
    </main>
  )
}
