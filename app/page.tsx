import Hero from '@/components/Hero';
import PromoStrip from '@/components/PromoStrip';
import SocialProofBar from '@/components/SocialProofBar';
import WhyUs from '@/components/WhyUs';
import SuitesGrid from '@/components/SuitesGrid';
import AmenitiesGrid from '@/components/AmenitiesGrid';
import DestinoSection from '@/components/DestinoSection';
import ToursSection from '@/components/ToursSection';
import VIPQuote from '@/components/VIPQuote';
import Testimonials from '@/components/Testimonials';
import NewsletterSection from '@/components/NewsletterSection';
import LocationSection from '@/components/LocationSection';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';
import StickyBar from '@/components/StickyBar';

// Schema unificado en @graph — evita duplicados y facilita la lectura de Google
const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.paraisoencantado.com/#website',
      name: 'Hotel Paraíso Encantado',
      url: 'https://www.paraisoencantado.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.paraisoencantado.com/habitaciones?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Hotel Paraíso Encantado',
  description:
    '13 suites boutique con spa privado a 5 minutos caminando del Jardín Surrealista de Edward James (Las Pozas) en Xilitla, Huasteca Potosina. El hotel más cercano a Las Pozas.',
  url: 'https://www.paraisoencantado.com',
  telephone: '+524891007679',
  email: 'reservas@paraisoencantado.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Xilitla',
    addressRegion: 'San Luis Potosí',
    addressCountry: 'MX',
    streetAddress: 'Xilitla, Huasteca Potosina',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 21.383,
    longitude: -99.002,
  },
  starRating: { '@type': 'Rating', ratingValue: 4 },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.6,
    reviewCount: 519,
    bestRating: 5,
    worstRating: 1,
  },
  priceRange: '$$',
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Private spa pool', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Free WiFi', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Free parking', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Restaurant', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Tours to Las Pozas', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Panoramic terrace', value: true },
  ],
  checkinTime: '15:00',
  checkoutTime: '12:00',
  currenciesAccepted: 'MXN, USD',
  paymentAccepted: 'Cash, Credit Card',
  sameAs: [
    'https://www.instagram.com/_paraiso_encantado/',
    'https://www.facebook.com/cabanas.encantado/',
  ],
};

// FAQPage schema — activa los acordeones directamente en los resultados de Google
const homeFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué tan cerca está del Jardín de Edward James?',
      acceptedAnswer: { '@type': 'Answer', text: 'A 5 minutos caminando (aproximadamente 400 metros). Somos el hotel MÁS cercano al Jardín Surrealista de Edward James (Las Pozas) en todo Xilitla.' },
    },
    {
      '@type': 'Question',
      name: '¿El desayuno está incluido en el precio?',
      acceptedAnswer: { '@type': 'Answer', text: 'El desayuno no está incluido en la tarifa. Nuestro restaurante El Papán Huasteco sirve desayunos auténticos de $100 a $200 MXN: tortillas hechas a mano en comal, zacahuil y café de olla.' },
    },
    {
      '@type': 'Question',
      name: '¿Puedo cancelar mi reserva sin cargo?',
      acceptedAnswer: { '@type': 'Answer', text: 'Sí. Puedes cancelar hasta 48 horas antes de tu llegada sin ningún cargo y te reembolsamos el 100% en 5-7 días hábiles. Política más flexible que Booking o Expedia.' },
    },
    {
      '@type': 'Question',
      name: '¿Qué incluye la tarifa de habitación?',
      acceptedAnswer: { '@type': 'Answer', text: 'Incluye: suite con todas sus amenidades, WiFi de alta velocidad, estacionamiento privado gratuito, acceso a la piscina spa y amenidades de baño. No incluye desayunos ni tours.' },
    },
    {
      '@type': 'Question',
      name: '¿Cuántas personas caben por habitación?',
      acceptedAnswer: { '@type': 'Answer', text: 'Entre 2 y 8 personas según la suite. Las suites estándar admiten 2-4 personas; las familiares Helechos hasta 6-8 personas. Persona adicional: +$300 MXN por noche.' },
    },
    {
      '@type': 'Question',
      name: '¿Es seguro pagar en línea?',
      acceptedAnswer: { '@type': 'Answer', text: '100% seguro. Usamos Stripe, el mismo sistema que Amazon y Uber. Tu información bancaria está encriptada de extremo a extremo. Nunca almacenamos datos de tarjetas. Recibes confirmación instantánea por email.' },
    },
    {
      '@type': 'Question',
      name: '¿Con cuánto se confirma la reserva?',
      acceptedAnswer: { '@type': 'Answer', text: '1 noche: se cobra el 100% al confirmar en línea. 2 noches o más: solo pagas el 50% ahora y el 50% restante lo liquidas en el hotel al check-in. Cancelación gratuita hasta 48 horas antes con reembolso total.' },
    },
    {
      '@type': 'Question',
      name: '¿Necesito coche para llegar al hotel?',
      acceptedAnswer: { '@type': 'Answer', text: 'Con auto propio es ideal — hay estacionamiento privado gratuito. Sin auto: toma autobús hasta Xilitla centro y luego taxi ($50 MXN). Te recogemos gratis si reservas 3 o más noches.' },
    },
    {
      '@type': 'Question',
      name: '¿Aceptan mascotas?',
      acceptedAnswer: { '@type': 'Answer', text: 'Actualmente no aceptamos mascotas en las habitaciones para preservar el ecosistema del hotel y el confort de todos los huéspedes.' },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }} />
      <main>
        <Hero />
        <PromoStrip />
        <SocialProofBar />
        <WhyUs />
        <SuitesGrid />
        <AmenitiesGrid />
        {/* DestinoSection moved after suites — user already knows where Xilitla is */}
        <DestinoSection />
        <ToursSection />
        <VIPQuote />
        <Testimonials />
        <NewsletterSection />
        <LocationSection />
        <FAQ />
        <FinalCTA />
        <StickyBar />
      </main>
    </>
  );
}
