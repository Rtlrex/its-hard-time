import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Thank you',
  description: 'A note from NORTHLINE. Thanks for joining us on the long way.',
  robots: { index: false, follow: false },
}

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  const isNewsletter = from === 'field-notes'
  return (
    <main className="thank-you-page">
      <header className="policy-header"><Link className="wordmark" href="/">NORTHLINE<span className="wordmark-mark">®</span></Link><span className="not-found-code">A NOTE FROM NORTHLINE</span></header>
      <section className="thank-you-card liquid-glass glass-crystal">
        <span className="thank-you-check"><Check size={21} /></span>
        <p className="eyebrow">{isNewsletter ? 'FIELD NOTES / YOU’RE IN' : 'NORTHLINE / THANK YOU'}</p>
        <h1>{isNewsletter ? <>You&apos;re on<br />the <em>list.</em></> : <>Thanks for<br />coming <em>along.</em></>}</h1>
        <p>{isNewsletter ? 'The next note from the long way will find its way to your inbox.' : 'Take a look around. Your next good thing might be just over the ridge.'}</p>
        <Link className="button button-light" href="/#new-arrivals">Back to the collection <ArrowRight size={15} /></Link>
      </section>
    </main>
  )
}
