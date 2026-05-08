import type {Metadata, Viewport} from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css'; // Global styles
import PwaRegistry from '@/components/PwaRegistry';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Gena Modas | Búzios 2026',
  description: 'Boutique de Moda Feminina (Luxo ao Beachwear) em Armação de Búzios.',
  manifest: '/manifest.json',
  applicationName: 'Gena Modas',
  appleWebApp: {
    capable: true,
    title: 'Gena Modas',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#b03d5d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-br" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans" suppressHydrationWarning>
        <PwaRegistry />
        {children}
      </body>
    </html>
  );
}
