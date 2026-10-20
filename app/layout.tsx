import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import TrackingSetup from '@/components/TrackingSetup';
import ClarityScript from '@/components/ClarityScript';
import ExitIntentPopup from '@/components/ExitIntentPopup';
import ScrollReveal from '@/components/ScrollReveal';
import StickyBar from '@/components/StickyBar';

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
  metadataBase: new URL('https://www.paraisoencantado.com'),
  title: 'Hotel Boutique en la Huasteca Potosina · Xilitla | Paraíso Encantado',
  description:
    'Hotel boutique en Xilitla a 5 min del Jardín de Edward James. 13 suites boutique, 4 con spa privado desde $1,500 MXN. Reserva directa · Cancelación flexible.',
  keywords: [
    'hotel xilitla', 'jardín edward james', 'las pozas xilitla',
    'huasteca potosina', 'hotel boutique', 'hotel paraíso encantado',
    'san luis potosí', 'boutique hotel edward james garden',
    'hotel near las pozas xilitla', 'huasteca potosina hotel english',
  ],
  // Sin `alternates` aquí (oct 2026): lo heredaba toda página que no declarara el suyo,
  // y así /encuesta y /gracias-por-tu-opinion se decían copia de la portada. Hoy son
  // noindex, pero la próxima página que lo olvide se declararía copia sin que el build
  // avise. La portada (app/page.tsx) declara su propio canonical y sus hreflang.
  openGraph: {
    siteName: 'Hotel Paraíso Encantado',
    title: 'Hotel Paraíso Encantado | Xilitla, Huasteca Potosina',
    description:
      '13 suites boutique, 4 con spa privado a 5 minutos caminando del Jardín de Edward James. Reserva directa sin comisiones.',
    locale: 'es_MX',
    alternateLocale: ['en_US', 'en_GB'],
    type: 'website',
    url: 'https://www.paraisoencantado.com',
    images: [
      {
        url: '/og/home.jpg',
        width: 1200,
        height: 630,
        alt: 'Hotel Paraíso Encantado — Xilitla, Huasteca Potosina',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@paraisoencantado',
    creator: '@paraisoencantado',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdmin = pathname.startsWith('/admin');
  // `/en` o `/en/…`, no cualquier ruta que empiece con «en» (/encuesta salía en inglés).
  const lang = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'es';

  // La barra fija de WhatsApp + Reservar vivía solo en la portada, y el 88% de
  // las visitas que llegan de Google son de celular: /restaurante, /xilitla,
  // /habitaciones, el blog y las landings se quedaban sin ningún botón a la
  // mano. Se excluyen las rutas que YA tienen su propia barra abajo, porque
  // montar dos las tapa entre sí: el motor de reserva y la ficha de cada
  // suite (que muestra el precio, mejor CTA que uno genérico).
  const esReserva = pathname === '/reservar' || pathname.startsWith('/reservar/');
  const esFichaSuite = /^\/habitaciones\/[^/]+/.test(pathname);
  // El atributo `data-barra-movil` del <body> lo lee WhatsAppButton.module.css
  // para esconder el botón flotante en celular justo donde la barra ya ofrece
  // WhatsApp (si no, la barra se le encima y el mismo CTA sale dos veces).
  const mostrarBarraMovil = !isAdmin && !esReserva && !esFichaSuite;

  return (
    <html lang={lang} className={`${cormorant.variable} ${jost.variable}`}>
      <head>
        {/* Google Tag Manager — fuera de /admin.
            El panel metía 451 vistas y 1,200 eventos de 6 usuarios en GA4 (un
            tercio de las páginas vistas del sitio) y falseaba rebote, duración
            y páginas más vistas. Clarity ya se excluía solo; GA4 no.
            Se decide aquí, en el servidor, con la ruta de la PRIMERA petición:
            quien entra por /admin no carga GTM en toda la sesión, que es justo
            lo que hace `pe_interno` en Clarity. */}
        {!isAdmin && <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-N98DFD9V');` }} />}
        {/* Microsoft Clarity (grabaciones). Se monta también en /admin: es su
            propia guarda la que sale temprano ahí y de paso marca el navegador
            como interno, para no medir al hotel como si fuera un huésped. */}
        <ClarityScript />
        {/* Sin JS: el contenido con animación de entrada se muestra igual */}
        <noscript dangerouslySetInnerHTML={{ __html: `<style>[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}</style>` }} />
      </head>
      <body data-barra-movil={mostrarBarraMovil ? '1' : undefined}>
        {/* Google Tag Manager (noscript) */}
        {!isAdmin && <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N98DFD9V" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>}
        {/* Fuera de /admin: su detector global de enlaces a wa.me contaba como
            contacto de huésped los clics del propio panel (p. ej. el de
            /admin/opinion), que entran a Google Ads como conversión. */}
        {!isAdmin && <TrackingSetup />}
        {!isAdmin && <ScrollReveal />}
        {!isAdmin && <Navbar />}
        {children}
        {!isAdmin && <Footer />}
        {!isAdmin && <WhatsAppButton />}
        {mostrarBarraMovil && <StickyBar />}
        {!isAdmin && <ExitIntentPopup />}
      </body>
    </html>
  );
}
