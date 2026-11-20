import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Trail not found',
  description: 'This path does not lead to a NORTHLINE page. Return to the shop and find your own north.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-orbit" aria-hidden="true" />
      <header className="policy-header"><Link className="wordmark" href="/">NORTHLINE<span className="wordmark-mark">®</span></Link><span className="not-found-code">404 / OFF THE MAP</span></header>
      <section className="not-found-card liquid-glass glass-smoked">
        <p className="eyebrow">The long way led here</p>
        <h1>Looks like<br />you found <em>elsewhere.</em></h1>
        <p>This page isn&apos;t on our map. The pieces, field notes, and your next route are still just ahead.</p>
        <div className="not-found-actions"><Link className="button button-light" href="/#new-arrivals">Explore the shop <ArrowUpRight size={15} /></Link><Link className="text-link" href="/">Return to Northline <ArrowLeft size={14} /></Link></div>
        <span className="not-found-coordinate">46° 38' N &nbsp; 12° 09' E</span>
      </section>
    </main>
  )
}
