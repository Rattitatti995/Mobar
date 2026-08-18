import type { Metadata } from 'next'
import './globals.css'
import AuthGate from '@/components/AuthGate'

export const metadata: Metadata = {
  title: 'MoBar',
  description: 'Cocktails with real bottle inventory tracking',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="no"><body><AuthGate>{children}</AuthGate></body></html>
}
