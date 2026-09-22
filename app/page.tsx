import type { Metadata } from 'next';
import { HOTEL, POSTAL_ADDRESS } from '@/lib/seo-hotel';
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

/**
 * Metadata propia de la portada.
 *
 * Hasta ahora heredaba la del layout ("Hotel Boutique en la Huasteca Potosina ·
 * Xilitla | Paraíso Encantado"): 68 caracteres y 613 px, o sea que Google lo
 * cortaba a media palabra y dejaba "Xilitla" en sexta posición. Esta portada es
 * la que compite por "hoteles en xilitla", "hotel xilitla" y sus variantes
 * —4,898 impresiones con 0.31% de clic— así que el título arranca con la frase
 * que la gente teclea y cierra con la prueba social. Medido: 56 caracteres,
 * 507 px en Arial 20 px, el tipo de letra con el que Google pinta los títulos.
 */
export const metadata: Metadata = {
  title: 'Hotel en Xilitla a 5 min de Las Pozas · 4.5★ 523 reseñas',
  description:
    '13 suites en Xilitla a 400 metros del Jardín de Edward James, 4 con spa privado en la terraza. Desde $1,500 MXN la noche. Reserva directo, sin comisiones.',
  alternates: {
    canonical: HOTEL.url,
    languages: {
      es: HOTEL.url,
      en: `${HOTEL.url}/en`,
      'x-default': HOTEL.url,
    },
  },
  openGraph: {
    siteName: HOTEL.nombre,
    title: 'Hotel en Xilitla a 5 minutos de Las Pozas de Edward James',
    description:
      '13 suites boutique, 4 con spa privado en la terraza, a 400 metros del Jardín de Edward James. Reserva directo con el hotel, sin comisiones.',
    url: HOTEL.url,
    type: 'website',
    locale: 'es_MX',
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
    title: 'Hotel en Xilitla a 5 minutos de Las Pozas de Edward James',
    description:
      '13 suites boutique, 4 con spa privado en la terraza, a 400 metros del Jardín de Edward James. Reserva directo con el hotel.',
    images: ['/og/home.jpg'],
  },
};

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

/**
 * La entidad Hotel de la portada.
 *
 * Tres cosas que se corrigieron aquí y conviene no deshacer:
 *
 * 1. **`@type` como texto, no como lista.** Antes decía `['Hotel', 'LocalBusiness']`.
 *    `Hotel` ya ES un `LocalBusiness` en schema.org, así que la lista no añadía nada
 *    y sí estorbaba: los validadores que buscan `"@type":"Hotel"` no encontraban la
 *    entidad, y la auditoría de septiembre concluyó por eso que la portada —la
 *    página que se lleva TODAS las búsquedas de marca— no declaraba qué era.
 * 2. **La dirección sale de `lib/seo-hotel.ts`.** Aquí estaba escrita a mano como
 *    "Calle 5 de Mayo, CP 79910", que no es la del hotel: es La Conchita, CP 79900,
 *    igual que en `public/llms.txt` y en las landings. Dos direcciones distintas para
 *    el mismo `@id` es justo lo que hace que Google no arme la ficha del negocio.
 * 3. **Un solo `aggregateRating`, el de esta entidad.** Los 13 que colgaban de cada
 *    suite se quitaron (ver `roomsSchema`).
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  '@id': 'https://www.paraisoencantado.com/#hotel',
  name: 'Hotel Paraíso Encantado',
  description:
    '13 suites boutique, 4 con spa privado a 5 minutos caminando del Jardín Surrealista de Edward James (Las Pozas) en Xilitla, Huasteca Potosina. El hotel más cercano a Las Pozas.',
  url: 'https://www.paraisoencantado.com',
  telephone: HOTEL.telefono,
  email: 'reservas@paraisoencantado.com',
  address: POSTAL_ADDRESS,
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 21.383,
    longitude: -99.002,
  },
  image: [
    'https://www.paraisoencantado.com/og/home.jpg',
    'https://www.paraisoencantado.com/images/JUNGLA/PORTADA.JPG',
  ],
  hasMap: 'https://maps.google.com/?q=Hotel+Paraíso+Encantado+Xilitla',
  starRating: { '@type': 'Rating', ratingValue: 4 },
  numberOfRooms: 13,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.5,
    reviewCount: 523,
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
  merchantReturnDays: 7,
  refundType: 'https://schema.org/FullRefund',
  returnFees: 'https://schema.org/FreeReturn',
  customerRemorseReturnFees: 'https://schema.org/FreeReturn',
  customerRemorseReturnLabelSource: 'https://schema.org/ReturnLabelCustomerResponsibility',
  description: 'Reembolso del 100% hasta 7 días antes del check-in; 50% hasta 3 días antes; con menos de 72 horas, solo cambio de fecha.',
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
/**
 * Cada suite traía su propio `aggregateRating` inventado (4.9 con 48 reseñas, 4.8 con
 * 52…). Eran 13 calificaciones que no salen de ningún lado: las reseñas reales son las
 * 523 de Google y son del hotel entero, no de la suite Jungla. Google ignora un rating
 * cuyo objeto no tiene reseñas propias y ese marcado puede leerse como engañoso, así
 * que la única calificación del sitio es la del Hotel, arriba.
 */
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
      offers: roomOffer(2000, 'flor-de-lis-1'),
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
      offers: roomOffer(2000, 'flor-de-lis-2'),
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
      offers: roomOffer(2000, 'lindavista'),
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
      offers: roomOffer(2000, 'jungla'),
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
      offers: roomOffer(1900, 'helechos-2'),
    },
  ],
};

/**
 * Las suites, ya con identidad propia, y el hotel que las contiene.
 *
 * Los `HotelRoom` apuntaban al hotel con `containedInPlace`, pero el hotel no
 * apuntaba de vuelta y las suites no tenían `@id`: para un buscador eran 13 nodos
 * anónimos flotando. Aquí se les da un `@id` derivado de su propia URL —así no hay
 * dos listas que mantener sincronizadas— y el hotel las reclama con `containsPlace`.
 */
const roomNodes = roomsSchema['@graph'].map(room => ({ '@id': `${room.url}#suite`, ...room }));

const roomsGraph = {
  '@context': 'https://schema.org',
  '@graph': roomNodes,
};

const hotelSchema = {
  ...jsonLd,
  containsPlace: roomNodes.map(room => ({ '@id': room['@id'] })),
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
      acceptedAnswer: { '@type': 'Answer', text: 'A 5 minutos caminando, unos 400 metros. Puedes desayunar en El Papán y a las 9 de la mañana ya estar en la entrada de Las Pozas. Somos el hotel más cercano al Jardín de Edward James en Xilitla.' },
    },
    {
      '@type': 'Question',
      name: '¿El desayuno está incluido en el precio?',
      acceptedAnswer: { '@type': 'Answer', text: 'No está incluido en la tarifa. Puedes agregarlo al reservar por $250 MXN por persona por noche: a elegir huevos, enchiladas huastecas o chilaquiles con huevo, con café o agua de frutas frescas y fruta. Se sirve en El Papán Huasteco, nuestro restaurante.' },
    },
    {
      '@type': 'Question',
      name: '¿Puedo cancelar mi reserva sin cargo?',
      acceptedAnswer: { '@type': 'Answer', text: 'Sí. Reembolsamos el 100% si cancelas hasta 7 días antes de tu llegada, el 50% hasta 3 días antes, y con menos de 72 horas no hay reembolso pero puedes cambiar la fecha. Los reembolsos se procesan en 5 a 10 días hábiles.' },
    },
    {
      '@type': 'Question',
      name: '¿Con cuánto se confirma la reserva?',
      acceptedAnswer: { '@type': 'Answer', text: '1 noche: se cobra el 100% al confirmar en línea. 2 noches o más: pagas el 50% ahora y el 50% restante en el hotel al llegar (efectivo, tarjeta o transferencia). El pago en línea es seguro, con Stripe.' },
    },
    {
      '@type': 'Question',
      name: '¿Cuántas personas caben por habitación?',
      acceptedAnswer: { '@type': 'Answer', text: 'Entre 2 y 8 personas según la suite. Las suites estándar admiten 2 a 4 personas; las familiares Helechos hasta 6 u 8. El precio base es para 2 personas; persona adicional, +$300 MXN por noche.' },
    },
    {
      '@type': 'Question',
      name: '¿Necesito coche para llegar al hotel?',
      acceptedAnswer: { '@type': 'Answer', text: 'Con auto propio es lo ideal: hay estacionamiento privado gratuito. Sin auto, puedes llegar en autobús a Xilitla centro y luego tomar un taxi (unos $50 MXN); te enviamos la ubicación exacta por WhatsApp.' },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      {/* Orden SEO optimizado: WebSite → Hotel → FAQPage → Restaurant → HotelRooms (secundarios) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(roomsGraph) }} />
      <main data-sticky-bar>
        <Hero />
        <SocialProofBar />
        <WhyUs />
        <SuitesGrid />
        <PromoStrip />
        <AmenitiesGrid />
        <DestinoSection />
        <ToursSection />
        {/* Bloque único de prueba social: visita presidencial + reseñas */}
        <VIPQuote />
        <Testimonials />
        <NewsletterSection />
        <LocationSection />
        <FAQ />
        <FinalCTA />
        {/* La barra fija ya no se monta aquí: vive en el layout para salir en todo el sitio */}
      </main>
    </>
  );
}
