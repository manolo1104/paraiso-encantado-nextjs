/**
 * Datos DUROS del hotel, en un solo lugar.
 *
 * Todas las páginas SEO citan de aquí. La razón no es DRY: es que los motores de
 * IA (ChatGPT, Perplexity, AI Overviews) castigan y confunden las cifras
 * contradictorias, y este sitio ya las tenía — `llms.txt` decía que las 13 suites
 * tenían piscina spa privada cuando son 4, y que la cancelación era a 48 h cuando
 * la política real son 7 días. Si un número cambia, se cambia AQUÍ y en
 * `public/llms.txt`, en ningún otro lado.
 *
 * Regla: si un dato no se puede verificar contra la hoja, la política publicada o
 * una fuente pública, no entra en este archivo y no se publica.
 */

export const HOTEL = {
  nombre: 'Hotel Paraíso Encantado',
  ciudad: 'Xilitla',
  estado: 'San Luis Potosí',
  region: 'Huasteca Potosina',
  direccion: 'Camino La Conchita–Las Pozas #10, La Conchita, Xilitla, San Luis Potosí, CP 79900',
  telefono: '+524891007679',
  whatsapp: 'https://wa.me/524891007679',
  url: 'https://www.paraisoencantado.com',

  // Reseñas verificadas en Google (mismas cifras que el schema del resto del sitio)
  rating: 4.5,
  reviewCount: 523,

  // Inventario real (data/suites.ts)
  suites: 13,
  suitesConSpaPrivado: 4,        // Jungla, LindaVista, Flor de Lis 1, Flor de Lis 2
  capacidadMaxima: 8,            // Helechos 2
  precioDesde: 1500,             // MXN/noche, 2 personas
  precioSuiteConSpa: 2000,       // MXN/noche, 2 personas — las 4 con spa privado

  // Confirmado por el dueño (31 ago 2026). Hasta esa fecha el sitio publicaba lo
  // contrario en la FAQ de /hotel-alberca-privada-xilitla ("se siente fresca en
  // diciembre y enero"), que estaba vendiendo de menos una ventaja real.
  spaClimatizado: true,
  spaAgua: 'Agua caliente climatizada, en la terraza privada de la suite',

  // Distancias verificadas
  metrosALasPozas: 400,
  minutosCaminandoALasPozas: 5,

  // Operación
  checkIn: '3:00 PM',
  checkOut: '12:00 PM',
  cancelacion: 'Reembolso 100% cancelando con 7 días de anticipación; 50% con 72 horas.',
  anticipo: 'Se paga 50% al reservar en estancias de 2 noches o más; el resto al llegar.',
  restaurante: 'El Papán Huasteco',
  restauranteHorario: '8:00 AM – 8:00 PM',
  // Confirmado por el dueño (31 ago 2026): el comal es de leña, no de gas.
  restauranteFirma: 'Tortillas hechas a mano al comal de leña, zacahuil y café de olla',
  codigoDescuento: 'XILITLA2026PE',
} as const;

/** Tiempos de traslado desde el hotel, en auto salvo que se indique. */
export const DISTANCIAS = [
  { destino: 'Las Pozas · Jardín Surrealista de Edward James', tiempo: '5 min caminando', nota: '400 metros — el hotel más cercano de Xilitla' },
  { destino: 'Centro de Xilitla', tiempo: '10 min caminando', nota: 'Mercado, café de olla y artesanías' },
  { destino: 'Cascada El Meco', tiempo: '1 h', nota: 'La cascada más accesible desde Xilitla' },
  { destino: 'Puente de Dios', tiempo: '1 h 30 min', nota: 'Aguas turquesa; requiere caminata y escalones' },
  { destino: 'Cascada de Tamul', tiempo: '2 h 30 min', nota: 'En canoa remontando el río; el tour ocupa el día completo' },
] as const;

/** Suites con piscina spa o tina de hidromasaje DENTRO de la suite. */
export const SUITES_CON_SPA = ['jungla', 'lindavista', 'flor-de-liz-1', 'flor-de-liz-2'] as const;

export const AGGREGATE_RATING = {
  '@type': 'AggregateRating',
  ratingValue: HOTEL.rating,
  reviewCount: HOTEL.reviewCount,
  bestRating: 5,
} as const;

export const POSTAL_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Camino La Conchita–Las Pozas #10, La Conchita',
  addressLocality: 'Xilitla',
  addressRegion: 'San Luis Potosí',
  postalCode: '79900',
  addressCountry: 'MX',
} as const;

/**
 * Bloque LodgingBusiness reutilizable para el JSON-LD de cada página.
 *
 * Tres decisiones que importan para que un buscador con IA entienda el sitio:
 *
 * 1. **`@id` fijo.** Antes cada landing emitía un `LodgingBusiness` anónimo, así
 *    que un modelo que leía seis páginas veía SEIS hoteles distintos con el
 *    mismo nombre, cada uno con sus propias reseñas y sus propios datos. Con el
 *    `@id` canónico son seis páginas describiendo UN hotel, y las señales se
 *    suman en vez de repartirse.
 * 2. **`name` siempre igual.** El nombre es la identidad de la entidad, no un
 *    espacio para meter palabras clave: los nombres inflados del tipo "Hotel X
 *    — el mejor hotel de Y" contradicen al resto del sitio y, según la
 *    investigación de GEO de Princeton, meter palabras clave a la fuerza baja
 *    la visibilidad en IA en vez de subirla. Lo específico de cada página va en
 *    `description`, que sí admite matiz.
 * 3. **`url` es la del hotel; la de la página va en `mainEntityOfPage`.** La
 *    entidad vive en el dominio; la página solo la describe.
 */
export function lodgingSchema(opts: { name?: string; description: string; url: string; image?: string }) {
  return {
    '@type': 'LodgingBusiness',
    '@id': `${HOTEL.url}/#hotel`,
    name: opts.name ?? HOTEL.nombre,
    description: opts.description,
    url: HOTEL.url,
    mainEntityOfPage: opts.url,
    telephone: HOTEL.telefono,
    address: POSTAL_ADDRESS,
    aggregateRating: AGGREGATE_RATING,
    priceRange: '$$',
    ...(opts.image ? { image: opts.image } : {}),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
