import type { Metadata } from 'next'
import './globals.css'
import './auth.css'
import './v2.css'
import './features.css'
import './product.css'
import './bottle-fix.css'
import './branding.css'
import './drink-price.css'
import './cocktail-art.css'
import AuthGate from '@/components/AuthGate'
import DrinkPriceFeedback from '@/components/DrinkPriceFeedback'
import AlphabeticalUi from '@/components/AlphabeticalUi'
import CocktailDbSync from '@/components/CocktailDbSync'
import CocktailArtwork from '@/components/CocktailArtwork'

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
  return <html lang="no"><body><AuthGate><CocktailDbSync/><CocktailArtwork/><DrinkPriceFeedback/><AlphabeticalUi/>{children}</AuthGate></body></html>
}
