import type { Metadata } from 'next'
import './globals.css'
import './bottle-form.css'
import './vinmonopolet.css'
import BottleFormUsability from '@/components/BottleFormUsability'
import VinmonopoletProductLinker from '@/components/VinmonopoletProductLinker'

export const metadata: Metadata = {
  title: 'MoBar',
  description: 'Cocktailkatalog, lagerbeholdning og kostpris i én hjemmebar-app',
  icons: {
    icon: '/mobar-mark.svg',
    shortcut: '/mobar-mark.svg',
    apple: '/mobar-mark.svg',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="no"><body><BottleFormUsability/><VinmonopoletProductLinker/>{children}</body></html>
}
