import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import TrackingSetup from '@/components/TrackingSetup';
import ExitIntentPopup from '@/components/ExitIntentPopup';
import CookieBanner from '@/components/CookieBanner';

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
  title: 'Hotel Paraíso Encantado · Xilitla | A 5 min del Jardín de Edward James',
  description:
    'Hotel boutique en Xilitla a 5 min del Jardín de Edward James. 13 suites con spa privado desde $1,200 MXN. Reserva directa · Cancelación gratuita 48h.',
  keywords: [
    'hotel xilitla', 'jardín edward james', 'las pozas xilitla',
    'huasteca potosina', 'hotel boutique', 'hotel paraíso encantado',
    'san luis potosí', 'boutique hotel edward james garden',
    'hotel near las pozas xilitla', 'huasteca potosina hotel english',
  ],
  alternates: {
    canonical: 'https://www.paraisoencantado.com',
    languages: {
      'es': 'https://www.paraisoencantado.com',
      'en': 'https://www.paraisoencantado.com/en',
      'x-default': 'https://www.paraisoencantado.com',
    },
  },
  openGraph: {
    title: 'Hotel Paraíso Encantado | Xilitla, Huasteca Potosina',
    description:
      '13 suites con spa privado a 5 minutos caminando del Jardín de Edward James. Reserva directa sin comisiones.',
    locale: 'es_MX',
    alternateLocale: ['en_US', 'en_GB'],
    type: 'website',
    url: 'https://www.paraisoencantado.com',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/Areas comunes/DSC09456-HDR.jpg',
        width: 1200,
        height: 630,
        alt: 'Hotel Paraíso Encantado — Xilitla, Huasteca Potosina',
      },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdmin = pathname.startsWith('/admin');
  const lang = pathname.startsWith('/en') ? 'en' : 'es';

  return (
    <html lang={lang} className={`${cormorant.variable} ${jost.variable}`}>
      <head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-N98DFD9V');` }} />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N98DFD9V" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
        <TrackingSetup />
        {!isAdmin && <Navbar />}
        {children}
        {!isAdmin && <Footer />}
        {!isAdmin && <WhatsAppButton />}
        {!isAdmin && <ExitIntentPopup />}
        {!isAdmin && <CookieBanner />}
      </body>
    </html>
  );
}
