'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react'

type ImageAsset = { url: string; altText: string | null; width: number | null; height: number | null }
export type StoreProduct = {
  id: string; title: string; handle: string; description: string; productType: string
  tags: string[]; availableForSale: boolean; featuredImage: ImageAsset | null
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } }
  variants: { nodes: { id: string; title: string; availableForSale: boolean }[] }
}
export type StoreCollection = { id: string; title: string; handle: string; image: ImageAsset | null }
export type CartLine = { id?: string; merchandiseId: string; quantity: number }
type Drawer = 'bag' | 'saved' | null

const money = (amount: string, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount))
const glassStyle: CSSProperties = { backdropFilter: 'blur(22px) saturate(1.55)', WebkitBackdropFilter: 'blur(22px) saturate(1.55)' }
const smokedGlassStyle: CSSProperties = { backdropFilter: 'blur(28px) saturate(1.6)', WebkitBackdropFilter: 'blur(28px) saturate(1.6)' }

function ProductSlot({ slot }: { slot: number }) {
  return <div className="product-slot" data-reveal="up"><div className="product-slot-frame"><span className="product-slot-number">{String(slot).padStart(2, '0')}</span><span className="product-slot-mark">N.</span><span className="product-slot-caption">FIELD / {String(slot).padStart(2, '0')}</span></div><div className="product-slot-label"><span>UPCOMING PIECE</span><span>COMING SOON</span></div></div>
}

export default function Storefront({ products, collections, storeDomain = '', initialCart = [], initialCheckoutUrl = '' }: { products: StoreProduct[]; collections: StoreCollection[]; storeDomain?: string; initialCart?: CartLine[]; initialCheckoutUrl?: string }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState('All pieces')
  const [sort, setSort] = useState('Featured')
  const [saved, setSaved] = useState<string[]>([])
  const [cart, setCart] = useState<CartLine[]>(initialCart)
  const [checkoutUrl, setCheckoutUrl] = useState(initialCheckoutUrl)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [newsletterError, setNewsletterError] = useState(false)
  const [newsletterConsentError, setNewsletterConsentError] = useState(false)
  const router = useRouter()
  const productCategories = ['All pieces', ...Array.from(new Set(products.map((product) => product.productType).filter(Boolean)))]
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = products.filter((product) => (selectedCollection === 'All pieces' || product.productType === selectedCollection) && (!term || `${product.title} ${product.productType} ${product.tags.join(' ')}`.toLowerCase().includes(term)))
    if (sort === 'Price: low to high') filtered.sort((a, b) => Number(a.priceRange.minVariantPrice.amount) - Number(b.priceRange.minVariantPrice.amount))
    if (sort === 'Price: high to low') filtered.sort((a, b) => Number(b.priceRange.minVariantPrice.amount) - Number(a.priceRange.minVariantPrice.amount))
    return filtered
  }, [products, search, selectedCollection, sort])
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return
    }
    document.documentElement.classList.add('motion-enabled')
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          currentObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' })
    elements.forEach((element) => observer.observe(element))
    return () => {
      observer.disconnect()
      document.documentElement.classList.remove('motion-enabled')
    }
  }, [])

  async function addToBag(product: StoreProduct) {
    const variant = product.variants.nodes.find((item) => item.availableForSale)
    if (!variant) return
    setLoading(product.id)
    try {
      const response = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchandiseId: variant.id, quantity: 1 }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not add this piece.')
      setCart(result.lines)
      if (result.checkoutUrl) setCheckoutUrl(result.checkoutUrl)
      setNotice(`${product.title} added to your bag`)
      window.setTimeout(() => setNotice(''), 3200)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not add this piece.')
      window.setTimeout(() => setNotice(''), 3200)
    } finally {
      setLoading(null)
    }
  }

  async function updateQuantity(line: CartLine, delta: number) {
    const nextQuantity = line.quantity + delta
    const nextCart = nextQuantity < 1 ? cart.filter((item) => item.merchandiseId !== line.merchandiseId) : cart.map((item) => item.merchandiseId === line.merchandiseId ? { ...item, quantity: nextQuantity } : item)
    setCart(nextCart)
    if (nextQuantity > 0) {
      await fetch('/api/cart', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchandiseId: line.merchandiseId, quantity: nextQuantity }) })
    } else {
      await fetch('/api/cart', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchandiseId: line.merchandiseId }) })
    }
  }

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewsletterMessage('')
    setNewsletterError(false)
    setNewsletterConsentError(false)
    if (!consent) {
      setNewsletterConsentError(true)
      setNewsletterMessage('Please confirm you would like to receive Field Notes.')
      return
    }
    try {
      const response = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Please try again later.')
      setEmail('')
      router.push('/thank-you?from=field-notes')
    } catch (error) {
      setNewsletterError(true)
      setNewsletterMessage(error instanceof Error ? error.message : 'Please try again later.')
    }
  }

  return (
    <main>
      <div className="announcement"><span>Complimentary shipping on orders over $150</span><span className="announcement-right">Made for the long way around <ArrowRight size={13} /></span></div>
      <section className="hero" id="top">
        <Image src="/night-campaign.png" alt="A hiker crossing a misty alpine ridge at first light" fill priority sizes="100vw" className="hero-image" />
        <div className="hero-shade" />
        <header className="site-header liquid-glass glass-smoked" style={smokedGlassStyle}>
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X /> : <Menu />}</button>
          <a className="wordmark" href="#top" aria-label="Northline home">NORTHLINE<span className="wordmark-mark">®</span></a>
          <nav className={menuOpen ? 'main-nav nav-open liquid-glass glass-smoked' : 'main-nav'} style={menuOpen ? smokedGlassStyle : undefined} aria-label="Main navigation">
            <a href="#new-arrivals" onClick={() => setMenuOpen(false)}>Shop</a><a href="#collections" onClick={() => setMenuOpen(false)}>Collections</a><a href="#field-notes" onClick={() => setMenuOpen(false)}>Field notes</a>
          </nav>
          <div className="header-actions">
            <button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label={searchOpen ? 'Close search' : 'Search'}><Search /></button>
            <button className="icon-button saved-trigger" onClick={() => setDrawer('saved')} aria-label={`Saved pieces, ${saved.length} items`}><Heart /><span className="action-label">Saved</span>{saved.length > 0 && <span className="count">{saved.length}</span>}</button>
            <button className="icon-button bag-trigger" onClick={() => setDrawer('bag')} aria-label={`Shopping bag, ${cartCount} items`}><ShoppingBag /><span className="action-label">Bag</span>{cartCount > 0 && <span className="count">{cartCount}</span>}</button>
          </div>
        </header>
        {searchOpen && <form className="search-panel liquid-glass glass-frosted" style={glassStyle} role="search" onSubmit={(event) => { event.preventDefault(); document.getElementById('new-arrivals')?.scrollIntoView({ behavior: 'smooth' }) }}><Search size={18} /><input autoFocus aria-label="Search the collection" placeholder="Search the collection" value={search} onChange={(event) => setSearch(event.target.value)} /><button type="button" aria-label="Close search" onClick={() => { setSearchOpen(false); setSearch('') }}><X size={18} /></button></form>}
        <div className="hero-copy"><p className="eyebrow hero-eyebrow">Equipment for the elsewhere</p><h1>Find your<br /><em>own north.</em></h1><p className="hero-description">Quietly capable layers, considered for the miles that stay with you.</p><a className="button button-light" href="#new-arrivals">Explore the collection <ArrowRight size={15} /></a></div>
        <div className="hero-caption liquid-glass glass-smoked" style={glassStyle}><span>46° 38' 46.7"N &nbsp; 12° 09' 54.8"E</span><span>Dolomites, Italy — 06:18 AM</span></div>
        <a className="hero-scroll" href="#new-arrivals" aria-label="Scroll to new arrivals"><ArrowDown size={16} /></a>
      </section>
      <div className="ticker" aria-label="Our approach"><span>BUILT TO GO FURTHER</span><i>✳</i><span>LESS, BUT BETTER</span><i>✳</i><span>BUILT TO GO FURTHER</span><i>✳</i><span>LESS, BUT BETTER</span><i>✳</i></div>

      <section className="section products-section" id="new-arrivals">
        <div className="section-heading" data-reveal="up"><div><p className="eyebrow">The latest from Northline</p><h2>New <em>arrivals</em></h2></div><a className="text-link" href="#collections">Explore all pieces <ArrowRight size={15} /></a></div>
        <div className="product-controls liquid-glass glass-frosted" style={glassStyle}><div className="category-tabs liquid-glass glass-smoked" style={glassStyle} role="group" aria-label="Filter products by category">{productCategories.map((category) => <button key={category} className={selectedCollection === category ? 'category-tab active' : 'category-tab'} onClick={() => setSelectedCollection(category)}>{category}</button>)}</div><label className="sort-control">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option>Featured</option><option>Price: low to high</option><option>Price: high to low</option></select><ChevronDown size={13} /></label></div>
        {visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product, index) => <article className={`product-card product-card-${index % 4}`} data-reveal="up" key={product.id}><div className="product-image-wrap">{product.featuredImage ? <a className="product-image-link" href={`/products/${product.handle}`} aria-label={`View ${product.title}`}><Image src={product.featuredImage.url} alt={product.featuredImage.altText || product.title} fill sizes="(max-width: 700px) 80vw, 25vw" className="product-image" /></a> : <a className="product-image-link product-no-image" href={`/products/${product.handle}`}>NORTHLINE / {product.productType || 'FIELD EQUIPMENT'}</a>}<button className={saved.includes(product.id) ? 'wishlist-button liquid-glass glass-crystal selected' : 'wishlist-button liquid-glass glass-crystal'} style={glassStyle} onClick={() => setSaved((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])} aria-label={saved.includes(product.id) ? `Remove ${product.title} from saved` : `Save ${product.title}`}><Heart size={17} fill={saved.includes(product.id) ? 'currentColor' : 'none'} /></button>{product.tags[0] && <span className="product-tag liquid-glass glass-smoked" style={glassStyle}>{product.tags[0]}</span>}<button className="quick-add liquid-glass glass-frosted" style={glassStyle} disabled={!product.availableForSale || loading === product.id} onClick={() => addToBag(product)}>{loading === product.id ? 'Adding…' : product.availableForSale ? 'Add to bag' : 'Sold out'} <ArrowUpRight size={14} /></button></div><div className="product-meta"><div><p className="product-category">{product.productType || 'Field equipment'}</p><h3><a href={`/products/${product.handle}`}>{product.title}</a></h3></div><span>{money(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}</span></div></article>)}{products.length > 0 && products.length < 4 && visibleProducts.length === products.length && Array.from({ length: 4 - products.length }, (_, index) => <ProductSlot slot={products.length + index + 1} key={`slot-${index}`} />)}</div> : <div className="product-empty-state"><div className="empty-catalog"><span className="empty-index">01 / THE COLLECTION</span><div><p className="eyebrow">The trail is being set</p><h3>{products.length ? 'No pieces found.' : 'A new chapter is taking shape.'}</h3><p>{products.length ? 'Try another search or explore all of our pieces.' : 'We’re preparing a considered collection for the long way around. In the meantime, come see where it all begins.'}</p>{products.length ? <button className="text-link" onClick={() => { setSearch(''); setSelectedCollection('All pieces') }}>Clear filters <ArrowRight size={15} /></button> : <a className="text-link" href="#field-notes">Read our field notes <ArrowRight size={15} /></a>}</div><span className="empty-coordinate">NORTHLINE · 2026</span></div>{products.length === 0 && <div className="product-slot-grid" role="group" aria-label="Upcoming pieces from Northline">{[1, 2, 3, 4].map((slot) => <ProductSlot slot={slot} key={slot} />)}</div>}</div>}
        <div className="product-footer-note"><span>Thoughtfully made. Intentionally kept.</span><span>{products.length ? `${products.length.toString().padStart(2, '0')} pieces in this edit` : 'The collection arrives soon'}</span></div>
      </section>

      <section className="campaign" aria-label="The Northline approach"><div className="campaign-photo" data-reveal="left"><Image src="/night-campaign.png" alt="A quiet morning in the Dolomites, home to our design philosophy" fill sizes="(max-width: 700px) 100vw, 58vw" /></div><div className="campaign-copy" data-reveal="right"><span className="campaign-index liquid-glass glass-smoked" style={glassStyle}>FIELD STUDY Nº 08 &nbsp; / &nbsp; ALTA VIA</span><p className="eyebrow">A little less, a little longer</p><h2>Made for<br />the <em>in-between.</em></h2><p>Early trains. Long trails. The stretch of silence between one place and the next. We make fewer, better things for the moments you don’t plan.</p><a className="text-link light-link" href="#field-notes">Our point of view <ArrowUpRight size={15} /></a><span className="campaign-coord">46° 38' N &nbsp; 12° 09' E</span></div></section>

      <section className="section collections-section" id="collections"><div className="section-heading" data-reveal="up"><div><p className="eyebrow">Purpose, in every detail</p><h2>Find your <em>element.</em></h2></div><span className="section-aside">Collections take shape around<br />the way you choose to go.</span></div>{collections.length ? <div className="collection-grid">{collections.map((collection, index) => <a data-reveal="up" className={`collection-tile collection-tile-${index % 3}`} href={storeDomain ? `https://${storeDomain}/collections/${collection.handle}` : '#new-arrivals'} key={collection.id} target={storeDomain ? '_blank' : undefined} rel={storeDomain ? 'noreferrer' : undefined}>{collection.image && <Image src={collection.image.url} alt={collection.image.altText || collection.title} fill sizes="(max-width: 700px) 90vw, 40vw" />}{!collection.image && <span className="collection-monogram">N.</span>}<span className="collection-overlay" /><span className="collection-number liquid-glass glass-smoked" style={glassStyle}>0{index + 1} &nbsp; / &nbsp; NORTHLINE</span><span className="collection-title liquid-glass glass-frosted" style={glassStyle}>{collection.title} <ArrowUpRight size={18} /></span></a>)}</div> : <div className="collections-empty"><span>01—08</span><p>We’re collecting inspiration, not things.<br />Our first collection is coming into focus.</p></div>}</section>

      <section className="story-section" id="field-notes"><div className="story-picture" data-reveal="left"><Image src="/night-campaign.png" alt="The far horizon above the mountain pass" fill sizes="(max-width: 700px) 100vw, 48vw" /><span>THE ALTA VIA, AT FIRST LIGHT</span></div><div className="story-content" data-reveal="right"><p className="eyebrow">A note from the long way</p><h2>Good things<br />take the <em>long way.</em></h2><p>Northline began with a simple question: what if getting there was the whole point? We’re a small independent label building with intention—drawing on a decade outdoors and making room for the unexpected.</p><a href="mailto:hello@northline.example" className="text-link">The story behind it <ArrowRight size={15} /></a><div className="story-mark">N</div></div></section>

      <section className="newsletter-section"><div className="newsletter-glass liquid-glass glass-crystal" style={glassStyle} data-reveal="up"><div><p className="eyebrow">Field notes · no. 01—∞</p><h2>Worth taking<br /><em>the long way.</em></h2><p>Letters from the edge of the map. New work, faraway places, and the things we learn along the way. Never noise.</p></div><form className="newsletter-form" onSubmit={subscribe}><label htmlFor="newsletter-email">Your email address</label><div className="newsletter-input-row"><input id="newsletter-email" type="email" required placeholder="you@somewhere.com" value={email} aria-invalid={newsletterError} aria-describedby="newsletter-message" onChange={(event) => { setEmail(event.target.value); setNewsletterError(false) }} /><button type="submit" aria-label="Subscribe to Field Notes"><ArrowRight size={18} /></button></div><label className="consent-label"><input type="checkbox" checked={consent} aria-invalid={newsletterConsentError} aria-describedby="newsletter-message" onChange={(event) => { setConsent(event.target.checked); setNewsletterConsentError(false) }} /> I’d like to receive occasional notes from Northline.</label><p id="newsletter-message" className={newsletterError || newsletterConsentError ? 'newsletter-message is-error' : 'newsletter-message'} aria-live="polite">{newsletterMessage}</p></form><span className="newsletter-number">NL / 001</span></div></section>

      <footer className="site-footer"><div className="footer-top"><div className="footer-brand"><a className="wordmark" href="#top">NORTHLINE<span className="wordmark-mark">®</span></a><p>Find your own north.</p><span>Built for wherever the day takes you.</span></div><div className="footer-links"><div><p>Discover</p><a href="#new-arrivals">Shop all</a><a href="#collections">Collections</a><a href="#field-notes">Our story</a></div><div><p>Good to know</p><a href="mailto:hello@northline.example">Contact</a><a href="mailto:hello@northline.example?subject=Shipping%20and%20returns">Shipping & returns</a><a href="/privacy">Privacy</a><a href="/terms">Terms &amp; conditions</a><button className="footer-cookie-settings" onClick={() => window.dispatchEvent(new Event('northline:open-cookie-settings'))}>Cookie settings</button></div><div><p>Elsewhere</p><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={12} /></a><a href="https://pinterest.com" target="_blank" rel="noreferrer">Pinterest <ArrowUpRight size={12} /></a></div></div></div><div className="footer-bottom"><span>© NORTHLINE 2026</span><span>MADE WITH INTENTION, WHEREVER WE ARE</span><a href="#top">BACK TO THE TOP ↑</a></div></footer>

      {notice && <div className="toast" role="status"><Check size={15} />{notice}</div>}
      {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(null)}><aside className="drawer liquid-glass glass-smoked" style={smokedGlassStyle} onClick={(event) => event.stopPropagation()} aria-label={drawer === 'bag' ? 'Shopping bag' : 'Saved pieces'}><div className="drawer-header"><div><p className="eyebrow">NORTHLINE / YOUR EDIT</p><h2>{drawer === 'bag' ? `Your bag (${cartCount})` : `Saved pieces (${saved.length})`}</h2></div><button className="icon-button" onClick={() => setDrawer(null)} aria-label="Close panel"><X /></button></div>{drawer === 'bag' ? <div className="drawer-body">{cart.length ? cart.map((line) => { const product = products.find((item) => item.variants.nodes.some((variant) => variant.id === line.merchandiseId)); return product ? <div className="drawer-line" key={line.merchandiseId}><div><p>{product.title}</p><span>{money(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}</span></div><div className="quantity-stepper"><button onClick={() => updateQuantity(line, -1)} aria-label={`Remove one ${product.title}`}>−</button><span>{line.quantity}</span><button onClick={() => updateQuantity(line, 1)} aria-label={`Add one ${product.title}`}>+</button></div></div> : null }) : <p className="drawer-empty">Your next favorite is out there.<br />The collection is coming soon.</p>}</div> : <div className="drawer-body">{saved.length ? saved.map((id) => { const product = products.find((item) => item.id === id); return product ? <div className="drawer-line" key={id}><div><p>{product.title}</p><span>{money(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}</span></div><button className="text-link" onClick={() => setSaved((current) => current.filter((item) => item !== id))}>Remove</button></div> : null }) : <p className="drawer-empty">Keep the pieces you love close.<br />Tap the heart to save them here.</p>}</div>}{drawer === 'bag' && cart.length > 0 && <div className="drawer-bottom"><p>Checkout is handled securely by Shopify.</p><a href={checkoutUrl || '#new-arrivals'} target={checkoutUrl ? '_blank' : undefined} rel="noreferrer" className="button button-dark">Continue to checkout <ArrowRight size={15} /></a></div>}</aside></div>}
    </main>
  )
}
