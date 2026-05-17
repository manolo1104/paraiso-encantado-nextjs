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

// WebSite con SearchAction — habilita Sitelinks Searchbox de Google
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
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
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Hotel Paraíso Encantado',
  description:
    '13 boutique suites with private spa 5 minutes walk from the Edward James Surrealist Garden (Las Pozas) in Xilitla, Huasteca Potosina.',
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

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
