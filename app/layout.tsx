import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BareBar',
  description: 'Cocktail recipes with real bottle inventory tracking',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="no"><body>{children}</body></html>
}
