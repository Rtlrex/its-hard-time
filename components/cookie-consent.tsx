'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Cookie } from 'lucide-react'

export type CookieChoice = 'accepted' | 'essential' | null

const glassStyle: CSSProperties = { backdropFilter: 'blur(28px) saturate(1.5)', WebkitBackdropFilter: 'blur(28px) saturate(1.5)' }

export default function CookieConsent({ initialChoice }: { initialChoice: CookieChoice }) {
  const [visible, setVisible] = useState(!initialChoice)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const reopen = () => setVisible(true)
    window.addEventListener('northline:open-cookie-settings', reopen)
    return () => window.removeEventListener('northline:open-cookie-settings', reopen)
  }, [])

  async function saveChoice(choice: Exclude<CookieChoice, null>) {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      })
      if (!response.ok) throw new Error('Your preference could not be saved. Please try again.')
      setVisible(false)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your preference could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <aside className="cookie-banner liquid-glass glass-smoked" style={glassStyle} aria-label="Cookie preferences">
      <div className="cookie-copy"><span className="cookie-icon"><Cookie size={17} /></span><div><p className="cookie-title">A little privacy, by design.</p><p>Essential cookies keep your bag ready. Optional analytics help us understand the store and only run with your permission. <a href="/privacy">Privacy details</a></p>{error && <p className="cookie-error" role="alert">{error}</p>}</div></div>
      <div className="cookie-actions"><button className="cookie-secondary" disabled={saving} onClick={() => saveChoice('essential')}>Essential only</button><button className="cookie-primary" disabled={saving} onClick={() => saveChoice('accepted')}>{saving ? 'Saving…' : 'Accept analytics'} <ArrowRight size={14} /></button></div>
    </aside>
  )
}
