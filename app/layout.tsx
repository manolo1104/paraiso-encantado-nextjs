import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Usando variable names exactos que se referencian en globals.css y CSS Modules
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hotel Paraíso Encantado | A 5 Min del Jardín Edward James · Xilitla',
  description:
    '13 suites boutique con spa privado en Xilitla. El hotel más cercano al Jardín Surrealista de Edward James (Las Pozas). Desde $1,500/noche con mejor precio garantizado.',
  keywords: [
    'hotel xilitla',
    'jardín edward james',
    'las pozas xilitla',
    'huasteca potosina',
    'hotel boutique',
    'hotel paraíso encantado',
    'san luis potosí',
  ],
  openGraph: {
    title: 'Hotel Paraíso Encantado | Xilitla, Huasteca Potosina',
    description:
      '13 suites con spa privado a 5 minutos caminando del Jardín de Edward James. Mejor precio garantizado.',
    locale: 'es_MX',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
