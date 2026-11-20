import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how NORTHLINE and our commerce partners handle your information and privacy choices.',
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <header className="policy-header"><Link className="wordmark" href="/">NORTHLINE<span className="wordmark-mark">®</span></Link><Link className="policy-back" href="/">Back to the store</Link></header>
      <article className="policy-content">
        <p className="eyebrow">NORTHLINE / YOUR INFORMATION</p>
        <h1>Privacy <em>policy.</em></h1>
        <p className="policy-updated">Last updated: November 20, 2026</p>
        <p>We keep data collection focused on running the store, fulfilling orders, and sending Field Notes only when you ask us to.</p>
        <h2>Information used to fulfill an order</h2>
        <p>When you shop, Shopify processes the information needed to provide checkout, payment, shipping, fraud prevention, and order support. The storefront sends cart items to Shopify to create a secure checkout. Payment details are handled by Shopify and its payment providers; they are not stored in this website&apos;s code.</p>
        <h2>Field Notes</h2>
        <p>If you enter your email and explicitly opt in, we send the address to Shopify so it can manage your marketing subscription. You can unsubscribe using the link in a marketing email or update your preferences through the store.</p>
        <h2>Cookies and analytics</h2>
        <p>An essential, secure cookie keeps your Shopify cart available between visits. Optional Vercel Analytics is enabled only after you choose “Accept analytics” in the cookie notice. Choosing “Essential only” keeps analytics disabled. You can reopen cookie choices using Cookie settings in the footer.</p>
        <h2>Service providers and retention</h2>
        <p>Shopify provides commerce, checkout, and customer-list services. Vercel hosts this website and provides analytics only when permitted. These providers process information under their own terms and privacy policies. Order and subscription records are retained according to Shopify&apos;s policies and applicable law.</p>
        <h2>Your choices</h2>
        <p>You may opt out of marketing at any time. To request access to, correction of, or deletion of information associated with an order or subscription, contact the store using the contact details displayed in Shopify checkout or the merchant&apos;s published contact page.</p>
        <h2>Updates</h2>
        <p>We may update this policy when our practices or legal requirements change. The date above identifies the latest revision.</p>
        <div className="policy-callout liquid-glass glass-smoked">This page describes the current storefront setup. Shopify&apos;s checkout and privacy disclosures apply when you continue to checkout.</div>
      </article>
    </main>
  )
}
