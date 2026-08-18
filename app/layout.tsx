import type { Metadata } from 'next'
import './globals.css'
import './auth.css'
import './v2.css'
import './features.css'
import './product.css'
import './bottle-fix.css'
import './branding.css'
import AuthGate from '@/components/AuthGate'
import DrinkPriceFeedback from '@/components/DrinkPriceFeedback'

export const metadata: Metadata = {
  title: 'MoBar',
  description: 'Cocktails with real bottle inventory intelligence',
  icons: {
    icon: '/mobar-mark.svg',
    shortcut: '/mobar-mark.svg',
    apple: '/mobar-mark.svg',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="no"><body><AuthGate><DrinkPriceFeedback/>{children}</AuthGate></body></html>
}
