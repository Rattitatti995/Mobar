import type { Metadata } from 'next'
import './globals.css'
import './auth.css'
import './v2.css'
import './features.css'
import AuthGate from '@/components/AuthGate'

export const metadata: Metadata = {
  title: 'MoBar',
  description: 'Cocktails with real bottle inventory intelligence',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="no"><body><AuthGate>{children}</AuthGate></body></html>
}
