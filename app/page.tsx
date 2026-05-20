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
import TripAdvisorReviews from '@/components/TripAdvisorReviews';
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
  '@type': ['Hotel', 'LocalBusiness'],
  '@id': 'https://www.paraisoencantado.com/#hotel',
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
    postalCode: '79910',
    addressCountry: 'MX',
    streetAddress: 'Calle 5 de Mayo, Xilitla, Huasteca Potosina',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 21.383,
    longitude: -99.002,
  },
  hasMap: 'https://maps.google.com/?q=Hotel+Paraíso+Encantado+Xilitla',
  starRating: { '@type': 'Rating', ratingValue: 4 },
  numberOfRooms: 13,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.8,
    reviewCount: 514,
    bestRating: 5,
    worstRating: 1,
  },
  review: [
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Fernanda Obregón' },
      datePublished: '2025-04-15',
      reviewBody: 'No es solo un hotel. Es el lugar donde entendí por qué Edward James eligió Xilitla para su obra de vida. El Paraíso tiene esa misma magia inexplicable. La suite con spa privado al amanecer es una experiencia que no se puede describir con palabras.',
      reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5 },
      publisher: { '@type': 'Organization', name: 'Google Reviews' },
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Pablo Guerrero' },
      datePublished: '2025-03-22',
      reviewBody: 'Llevan años compitiendo con cadenas internacionales sin perder su alma local. El restaurante, los guías, la forma en que cuidan la naturaleza — todo grita "aquí trabajamos personas de aquí". Eso es lo que busco cuando viajo.',
      reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5 },
      publisher: { '@type': 'Organization', name: 'Google Reviews' },
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Diana Muñiz' },
      datePublished: '2025-02-10',
      reviewBody: 'Vine tres veces ya. No es la piscina ni las vistas (aunque son increíbles). Es que cada vez que llego me reciben como si hubiera faltado tiempo. El hotel más cercano a Las Pozas y sin duda el mejor.',
      reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5 },
      publisher: { '@type': 'Organization', name: 'Google Reviews' },
    },
  ],
  priceRange: '$$',
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Private spa pool', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Free WiFi', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Free parking', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'On-site restaurant', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Tours to Las Pozas', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Panoramic terrace', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Air conditioning', value: true },
  ],
  checkinTime: '15:00',
  checkoutTime: '12:00',
  currenciesAccepted: 'MXN, USD',
  paymentAccepted: 'Cash, Credit Card',
  sameAs: [
    'https://www.instagram.com/_paraiso_encantado/',
    'https://www.facebook.com/cabanas.encantado/',
    'https://www.youtube.com/@hotelparaisoencantadoxilit8111',
  ],
};

const PRICE_VALID_UNTIL = '2026-12-31';
const BASE_AMENITIES = [
  { '@type': 'LocationFeatureSpecification', name: 'WiFi gratuito', value: true },
  { '@type': 'LocationFeatureSpecification', name: 'Aire acondicionado', value: true },
  { '@type': 'LocationFeatureSpecification', name: 'Baño privado', value: true },
];
const HOTEL_REF = { '@id': 'https://www.paraisoencantado.com/#hotel' };

const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'MX',
  returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
  merchantReturnDays: 2,
  refundType: 'https://schema.org/FullRefund',
  returnFees: 'https://schema.org/FreeReturn',
  customerRemorseReturnFees: 'https://schema.org/FreeReturn',
  customerRemorseReturnLabelSource: 'https://schema.org/ReturnLabelCustomerResponsibility',
  description: 'Cancelación gratuita hasta 48 horas antes del check-in. Reembolso del 100%.',
};

function roomOffer(price: number, slug: string) {
  return {
    '@type': 'Offer',
    priceCurrency: 'MXN',
    price,
    priceValidUntil: PRICE_VALID_UNTIL,
    availability: 'https://schema.org/InStock',
    url: `https://www.paraisoencantado.com/reservar?room=${slug}`,
    hasMerchantReturnPolicy: RETURN_POLICY,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price,
      priceCurrency: 'MXN',
      valueAddedTaxIncluded: true,
      unitCode: 'DAY',
      unitText: 'por noche',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        unitCode: 'C62',
      },
    },
  };
}
function beds(type: string, count: number) {
  return { '@type': 'BedDetails', typeOfBed: type, numberOfBeds: count };
}
function floorSize(m2: number) {
  return { '@type': 'QuantitativeValue', value: m2, unitCode: 'MTK' };
}
function roomRating(value: number, count: number) {
  return { '@type': 'AggregateRating', ratingValue: value, reviewCount: count, bestRating: 5 };
}

const roomsSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'HotelRoom',
      name: 'Suite Flor de Liz 1',
      description: 'Vistas panorámicas a la montaña y spa privado al aire libre para detener el tiempo.',
      url: 'https://www.paraisoencantado.com/habitaciones/flor-de-lis-1',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 4, minValue: 1 },
      bed: [beds('Queen size bed', 2)],
      floorSize: floorSize(40),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Spa privado al aire libre', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Terraza con vista panorámica', value: true },
      ],
      aggregateRating: roomRating(4.9, 48),
      offers: roomOffer(1900, 'flor-de-lis-1'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Suite Flor de Liz 2',
      description: 'Relajación profunda con tu propio spa privado y atardeceres incomparables sobre el pueblo.',
      url: 'https://www.paraisoencantado.com/habitaciones/flor-de-lis-2',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 4, minValue: 1 },
      bed: [beds('Queen size bed', 2)],
      floorSize: floorSize(40),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Spa privado al aire libre', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Terraza con vista panorámica', value: true },
      ],
      aggregateRating: roomRating(4.8, 52),
      offers: roomOffer(1900, 'flor-de-lis-2'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Suite LindaVista',
      description: 'Inmersión total en el bosque con tina de hidromasaje y vistas ininterrumpidas desde las alturas.',
      url: 'https://www.paraisoencantado.com/habitaciones/lindavista',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 4, minValue: 1 },
      bed: [beds('King size bed', 1), beds('Queen size bed', 1)],
      floorSize: floorSize(50),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Tina de hidromasaje', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Terraza privada con vista a la montaña', value: true },
      ],
      aggregateRating: roomRating(4.8, 31),
      offers: roomOffer(1900, 'lindavista'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Suite Jungla',
      description: 'Un santuario inmerso en la selva con spa privado de inmersión y exclusividad total.',
      url: 'https://www.paraisoencantado.com/habitaciones/jungla',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 4, minValue: 1 },
      bed: [beds('King size bed', 1), beds('Queen size bed', 1)],
      floorSize: floorSize(52),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Spa privado', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Terraza privada con vista a la selva', value: true },
      ],
      aggregateRating: roomRating(4.9, 67),
      offers: roomOffer(1900, 'jungla'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Suite Lajas',
      description: 'Amplitud elegante con sala de estar y terraza frente al majestuoso paisaje de Xilitla.',
      url: 'https://www.paraisoencantado.com/habitaciones/lajas',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 4, minValue: 1 },
      bed: [beds('Queen size bed', 2)],
      floorSize: floorSize(45),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Sala de estar independiente', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Terraza con vista panorámica', value: true },
      ],
      aggregateRating: roomRating(4.7, 29),
      offers: roomOffer(1900, 'lajas'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Lirios 1',
      description: 'Desconexión total y descanso reparador en un espacio abrazado por la vegetación.',
      url: 'https://www.paraisoencantado.com/habitaciones/lirios-1',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 4, minValue: 1 },
      bed: [beds('Queen size bed', 2)],
      floorSize: floorSize(30),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Vista al jardín y selva', value: true },
      ],
      aggregateRating: roomRating(4.7, 38),
      offers: roomOffer(1500, 'lirios-1'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Lirios 2',
      description: 'Un rincón de paz y silencio absoluto con balcón privado hacia los jardines.',
      url: 'https://www.paraisoencantado.com/habitaciones/lirios-2',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 4, minValue: 1 },
      bed: [beds('Queen size bed', 2)],
      floorSize: floorSize(30),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Balcón privado con vista a jardines', value: true },
      ],
      aggregateRating: roomRating(4.8, 41),
      offers: roomOffer(1500, 'lirios-2'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Orquídeas 2',
      description: 'Confort superior en cama King Size con perspectiva elevada de la selva.',
      url: 'https://www.paraisoencantado.com/habitaciones/orquideas-2',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 2, minValue: 1 },
      bed: [beds('King size bed', 1)],
      floorSize: floorSize(28),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Terraza con vista a piscina y selva', value: true },
      ],
      aggregateRating: roomRating(4.7, 35),
      offers: roomOffer(1500, 'orquideas-2'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Orquídeas Doble',
      description: 'Amplitud para cuatro personas con terraza y vistas a la piscina.',
      url: 'https://www.paraisoencantado.com/habitaciones/orquideas-doble',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 4, minValue: 1 },
      bed: [beds('Queen size bed', 2)],
      floorSize: floorSize(32),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Terraza con vista a piscina y selva', value: true },
      ],
      aggregateRating: roomRating(4.8, 44),
      offers: roomOffer(1500, 'orquideas-doble'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Orquídeas 3',
      description: 'Vista elevada de la selva desde King Size, paz absoluta y acceso a piscina.',
      url: 'https://www.paraisoencantado.com/habitaciones/orquideas-3',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 2, minValue: 1 },
      bed: [beds('King size bed', 1)],
      floorSize: floorSize(28),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Terraza con vista elevada a piscina', value: true },
      ],
      aggregateRating: roomRating(4.9, 39),
      offers: roomOffer(1500, 'orquideas-3'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Bromelias',
      description: 'Diseño contemporáneo en planta baja con acceso fluido a la piscina.',
      url: 'https://www.paraisoencantado.com/habitaciones/bromelias',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 4, minValue: 1 },
      bed: [beds('Queen size bed', 2)],
      floorSize: floorSize(30),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Acceso directo a piscina spa', value: true },
      ],
      aggregateRating: roomRating(4.7, 27),
      offers: roomOffer(1500, 'bromelias'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Helechos 1',
      description: 'El espacio perfecto para la familia con tres camas matrimoniales y acceso a la piscina.',
      url: 'https://www.paraisoencantado.com/habitaciones/helechos-1',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 6, minValue: 1 },
      bed: [beds('Queen size bed', 3)],
      floorSize: floorSize(65),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Suite familiar', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Terraza con vista a piscina', value: true },
      ],
      aggregateRating: roomRating(4.8, 33),
      offers: roomOffer(1900, 'helechos-1'),
    },
    {
      '@type': 'HotelRoom',
      name: 'Helechos 2',
      description: 'El refugio ideal para grupos: cuatro camas matrimoniales y vistas a la naturaleza.',
      url: 'https://www.paraisoencantado.com/habitaciones/helechos-2',
      containedInPlace: HOTEL_REF,
      numberOfRooms: 1,
      occupancy: { '@type': 'QuantitativeValue', maxValue: 6, minValue: 1 },
      bed: [beds('Queen size bed', 4)],
      floorSize: floorSize(70),
      petsAllowed: false,
      smokingAllowed: false,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      amenityFeature: [...BASE_AMENITIES,
        { '@type': 'LocationFeatureSpecification', name: 'Suite familiar plus', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Vista a jardín y naturaleza', value: true },
      ],
      aggregateRating: roomRating(4.8, 30),
      offers: roomOffer(1900, 'helechos-2'),
    },
  ],
};

const restaurantSchema = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'El Papán Huasteco',
  description: 'Restaurante de cocina huasteca auténtica en el Hotel Paraíso Encantado. Tortillas hechas a mano en comal, zacahuil, bocoles y café de olla.',
  url: 'https://www.paraisoencantado.com/restaurante',
  telephone: '+524891007679',
  servesCuisine: ['Cocina Huasteca', 'Cocina Mexicana', 'Gastronomía Potosina'],
  priceRange: '$',
  openingHours: ['Mo-Su 08:00-21:00'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Xilitla',
    addressRegion: 'San Luis Potosí',
    addressCountry: 'MX',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 21.383,
    longitude: -99.002,
  },
  containedInPlace: { '@id': 'https://www.paraisoencantado.com/#hotel' },
  menu: 'https://www.paraisoencantado.com/restaurante',
  hasMenu: {
    '@type': 'Menu',
    name: 'Menú El Papán Huasteco',
    description: 'Gastronomía huasteca auténtica con ingredientes locales: zacahuil, bocoles, enchiladas huastecas, café de olla y desayunos tradicionales.',
  },
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
      {/* Orden SEO optimizado: WebSite → Hotel → FAQPage → Restaurant → HotelRooms (secundarios) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(roomsSchema) }} />
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
        <TripAdvisorReviews />
        <NewsletterSection />
        <LocationSection />
        <FAQ />
        <FinalCTA />
        <StickyBar />
      </main>
    </>
  );
}
