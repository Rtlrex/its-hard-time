import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import CookieConsent from '@/components/cookie-consent'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await getSiteUrl(),
    title: {
      default: 'NORTHLINE — Equipment for the Elsewhere',
      template: '%s | NORTHLINE',
    },
    description: 'Quietly capable outdoor layers and considered field equipment, made for the miles that stay with you.',
    openGraph: {
      title: 'NORTHLINE — Equipment for the Elsewhere',
      description: 'Quietly capable outdoor layers, considered for the miles that stay with you.',
      type: 'website',
      siteName: 'NORTHLINE',
      url: '/',
      images: [{ url: '/og-northline.png', width: 1200, height: 630, alt: 'NORTHLINE alpine campaign at blue hour' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'NORTHLINE — Equipment for the Elsewhere',
      description: 'Quietly capable outdoor layers, considered for the miles that stay with you.',
      images: ['/og-northline.png'],
    },
    generator: 'Next.js',
    icons: {
      icon: [{ url: '/northline-mark.svg', type: 'image/svg+xml', sizes: 'any' }],
      apple: '/apple-icon.png',
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#080a10',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const storedChoice = cookieStore.get('northline_consent')?.value
  const initialChoice = storedChoice === 'accepted' || storedChoice === 'essential' ? storedChoice : null

  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <CookieConsent initialChoice={initialChoice} />
        {process.env.NODE_ENV === 'production' && initialChoice === 'accepted' && <Analytics />}
      </body>
    </html>
  )
}
