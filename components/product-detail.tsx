'use client'

import Image from 'next/image'
import { useState, type CSSProperties } from 'react'
import { ArrowRight, Check, Heart, Minus, Plus } from 'lucide-react'

type DetailImage = { url: string; altText: string | null; width: number | null; height: number | null }
type DetailVariant = { id: string; title: string; availableForSale: boolean; selectedOptions: { name: string; value: string }[]; price: { amount: string; currencyCode: string } }
export type DetailProduct = { id: string; title: string; handle: string; description: string; productType: string; availableForSale: boolean; featuredImage: DetailImage | null; images: { nodes: DetailImage[] }; priceRange: { minVariantPrice: { amount: string; currencyCode: string } }; variants: { nodes: DetailVariant[] } }

const formatPrice = (amount: string, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount))
const detailGlassStyle: CSSProperties = { backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }

export default function ProductDetail({ product }: { product: DetailProduct }) {
  const images = product.images.nodes.length ? product.images.nodes : product.featuredImage ? [product.featuredImage] : []
  const [activeImage, setActiveImage] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>(() => Object.fromEntries(product.variants.nodes[0]?.selectedOptions.map((option) => [option.name, option.value]) ?? []))
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const selectedVariant = product.variants.nodes.find((variant) => variant.selectedOptions.every((option) => selections[option.name] === option.value))
  const optionGroups = Object.entries(product.variants.nodes.reduce<Record<string, Set<string>>>((groups, variant) => { variant.selectedOptions.forEach(({ name, value }) => { (groups[name] ??= new Set()).add(value) }); return groups }, {}))
  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice

  async function addToBag() {
    if (!selectedVariant?.availableForSale) return
    setBusy(true)
    try {
      const response = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchandiseId: selectedVariant.id, quantity }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not add this piece.')
      setMessage('Added to your Shopify bag.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not add this piece.') }
    finally { setBusy(false); window.setTimeout(() => setMessage(''), 3500) }
  }

  return <div className="detail-content"><div className="detail-gallery"><div className="detail-main-image">{images[activeImage] ? <Image src={images[activeImage].url} alt={images[activeImage].altText || product.title} fill priority sizes="(max-width: 760px) 100vw, 55vw" /> : <div className="product-no-image">NORTHLINE / {product.productType}</div>}<span className="detail-image-index liquid-glass glass-smoked" style={detailGlassStyle}>{String(activeImage + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span></div>{images.length > 1 && <div className="detail-thumbnails">{images.map((image, index) => <button className={activeImage === index ? 'detail-thumbnail liquid-glass glass-frosted selected' : 'detail-thumbnail liquid-glass glass-frosted'} style={detailGlassStyle} onClick={() => setActiveImage(index)} aria-label={`Show product image ${index + 1}`} key={image.url}><Image src={image.url} alt={image.altText || `${product.title} view ${index + 1}`} fill sizes="90px" /></button>)}</div>}</div><section className="detail-info"><p className="eyebrow">{product.productType || 'Field equipment'} / designed for the miles</p><h1>{product.title}</h1><p className="detail-price">{formatPrice(price.amount, price.currencyCode)}</p><p className="detail-description">{product.description}</p><div className="detail-rule" />{optionGroups.map(([name, values]) => <fieldset className="variant-group" key={name}><legend>{name}<span>{selections[name]}</span></legend><div className="variant-options">{[...values].map((value) => { const available = product.variants.nodes.some((variant) => variant.availableForSale && variant.selectedOptions.every((option) => option.name === name ? option.value === value : selections[option.name] === value)); return <button type="button" key={value} className={selections[name] === value ? 'variant-option liquid-glass glass-frosted selected' : 'variant-option liquid-glass glass-frosted'} style={detailGlassStyle} disabled={!available} aria-pressed={selections[name] === value} onClick={() => setSelections((current) => ({ ...current, [name]: value }))}>{value}</button> })}</div></fieldset>)}<div className="detail-buy-row"><div className="quantity-stepper detail-quantity liquid-glass glass-smoked" style={detailGlassStyle}><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={13} /></button><span>{quantity}</span><button onClick={() => setQuantity((value) => Math.min(10, value + 1))} aria-label="Increase quantity"><Plus size={13} /></button></div><button className="button button-dark detail-add" disabled={!selectedVariant?.availableForSale || busy} onClick={addToBag}>{busy ? 'Adding…' : selectedVariant?.availableForSale ? 'Add to bag' : 'Unavailable'} <ArrowRight size={15} /></button><button className={saved ? 'detail-save liquid-glass glass-crystal saved' : 'detail-save liquid-glass glass-crystal'} style={detailGlassStyle} onClick={() => setSaved(!saved)} aria-label={saved ? 'Remove from saved pieces' : 'Save this piece'}><Heart fill={saved ? 'currentColor' : 'none'} /></button></div><p className="detail-feedback" aria-live="polite">{message}</p><div className="detail-rule" /><div className="detail-promise liquid-glass glass-smoked" style={detailGlassStyle}><Check size={15} /><span>Complimentary shipping over $150</span></div><div className="detail-promise liquid-glass glass-smoked" style={detailGlassStyle}><Check size={15} /><span>Considered materials. Made to be repaired.</span></div><a className="detail-support" href="mailto:hello@northline.example">A question about this piece? Get in touch <ArrowRight size={14} /></a></section><div className="mobile-sticky-buy liquid-glass glass-frosted" style={detailGlassStyle}><div><span>{product.title}</span><strong>{formatPrice(price.amount, price.currencyCode)}</strong></div><button className="button button-dark" disabled={!selectedVariant?.availableForSale || busy} onClick={addToBag}>{busy ? 'Adding…' : 'Add to bag'} <ArrowRight size={15} /></button></div></div>
}
