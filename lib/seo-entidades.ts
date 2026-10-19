/**
 * Entidades del grafo de conocimiento — verificadas, con su Wikidata.
 *
 * Para qué sirve esto. Un buscador con IA no "lee" el nombre "Las Pozas" y
 * sabe de qué habla: tiene que resolverlo contra una entidad conocida. Si el
 * sitio se limita a escribir los nombres en prosa, el modelo tiene que
 * adivinar. Si además declara `sameAs` hacia Wikipedia y Wikidata, la
 * ambigüedad desaparece y el hotel queda enganchado a nodos que el modelo ya
 * conoce y en los que ya confía: Edward James, Las Pozas, Xilitla, la
 * presidencia de México.
 *
 * Esto importa especialmente aquí porque "Xilitla" a secas es una página de
 * DESAMBIGUACIÓN en Wikipedia (hay otro Xilitla en Hidalgo). Enlazar al
 * artículo equivocado sería peor que no enlazar.
 *
 * Regla, la misma que en `seo-hotel.ts`: cada URL e identificador de aquí se
 * comprobó contra la fuente antes de escribirlo (31 ago 2026). Si una entidad
 * no se puede verificar, no entra.
 */

/**
 * Identificadores canónicos del sitio. TODAS las páginas deben referirse al
 * hotel con el mismo `@id`: si cada página declara un `LodgingBusiness`
 * anónimo, el modelo ve N hoteles distintos en vez de uno con N páginas.
 *
 * `organization` es un ALIAS del hotel, no otra entidad (16 oct 2026). Hasta
 * esa fecha era `#organization` y /sobre-nosotros y /mejor-hotel-xilitla lo
 * declaraban como un negocio aparte, con el mismo nombre, la misma dirección y
 * las mismas reseñas: para Google y las IA eran dos hoteles. El hotel ES la
 * organización que firma y publica las páginas, así que el alias deja que el
 * código que firma con `ENTITY_IDS.organization` apunte al único hotel.
 */
export const ENTITY_IDS = {
  hotel: 'https://www.paraisoencantado.com/#hotel',
  website: 'https://www.paraisoencantado.com/#website',
  organization: 'https://www.paraisoencantado.com/#hotel',
} as const;

export const HOTEL_REF = { '@id': ENTITY_IDS.hotel } as const;

/**
 * El perfil de Google del hotel (Maps). El cid sale de decodificar el enlace de
 * reseñas g.page/r/CY84xO7VaxDbEBM: es el mismo negocio (comprobado el 13 oct
 * 2026). Es la ficha con 4.5 y 540 reseñas y teléfono 489 100 7679; la del
 * 489 100 7601 («Posada Paraiso Encantado», Matamoros 205) es OTRA ficha.
 */
export const PERFIL_GOOGLE = 'https://maps.google.com/?cid=15785235260511631503';

/**
 * Perfiles públicos del hotel, para `sameAs`.
 *
 * Por ahora SOLO el de Google (16 oct 2026). Las redes que se declaraban aquí no
 * coinciden con las del pie de página (el pie enlaza instagram.com/
 * paraisoencantadoxilitla y facebook.com/paraisoencantadoxilitla), la página de
 * Facebook declarada lleva el nombre viejo «Cabañas», la bio de Instagram dice
 * «15 habitaciones» y la de LinkedIn respondía 404. Un `sameAs` a la cuenta
 * equivocada le pega al hotel los datos de otra entidad. Cuando Manolo confirme
 * cuáles son las oficiales, se agregan aquí y en el pie (components/Footer.tsx):
 *   'https://www.instagram.com/_paraiso_encantado/'
 *   'https://www.facebook.com/cabanas.encantado/'
 *   'https://www.youtube.com/@hotelparaisoencantadoxilit8111'
 *   'https://www.linkedin.com/company/hotel-paraiso-encantado-xilitla/'
 */
export const PERFILES_HOTEL = [PERFIL_GOOGLE] as const;

/** Las Pozas / Jardín Escultórico Edward James — Wikidata Q11688402. */
export const LAS_POZAS = {
  '@type': 'TouristAttraction',
  '@id': 'https://www.wikidata.org/wiki/Q11688402',
  name: 'Las Pozas — Jardín Escultórico Edward James',
  description:
    // Cifras de la hoja única (2 oct 2026): la declaratoria de 2012 fue de la SEP
    // (Acuerdo 658), no del INBA; y "27 estructuras" es solo el área visitable.
    'Jardín escultórico surrealista creado por Edward James en Xilitla: más de 30 estructuras de concreto levantadas entre 1962 y 1984, en un predio de 37 hectáreas (unas 9 de jardín). Abierto al público en 1991 y declarado Monumento Artístico en 2012 (Acuerdo 658 de la SEP).',
  // La Wikipedia en inglés entró el 17 oct 2026 (la página /en también la cita):
  // Wikidata Q11688402 enlaza «Las_Pozas» en las dos Wikipedias (comprobado el 13 oct).
  sameAs: [
    'https://es.wikipedia.org/wiki/Las_Pozas',
    'https://en.wikipedia.org/wiki/Las_Pozas',
    'https://www.wikidata.org/wiki/Q11688402',
  ],
  // Pin oficial de laspozasxilitla.org.mx (2 oct 2026); el anterior (21.387, -98.994) caía a 1.1 km.
  geo: { '@type': 'GeoCoordinates', latitude: 21.3967, longitude: -98.9966 },
} as const;

/**
 * El pueblo de Xilitla, San Luis Potosí — Wikidata Q2313212.
 * OJO: no es `es.wikipedia.org/wiki/Xilitla`, que es la desambiguación.
 */
export const XILITLA = {
  '@type': 'City',
  '@id': 'https://www.wikidata.org/wiki/Q2313212',
  name: 'Xilitla',
  alternateName: 'Xilitla, San Luis Potosí',
  sameAs: [
    'https://es.wikipedia.org/wiki/Xilitla_(San_Luis_Potos%C3%AD)',
    'https://www.wikidata.org/wiki/Q2313212',
  ],
  containedInPlace: {
    '@type': 'AdministrativeArea',
    name: 'San Luis Potosí, México',
  },
} as const;

/** Edward James (1907–1984) — Wikidata Q196055. */
export const EDWARD_JAMES = {
  '@type': 'Person',
  '@id': 'https://www.wikidata.org/wiki/Q196055',
  name: 'Edward James',
  description: 'Poeta, escultor y mecenas británico del surrealismo, creador de Las Pozas en Xilitla.',
  // En inglés desde el 17 oct 2026: en.wikipedia «Edward_James» resuelve a Q196055.
  sameAs: [
    'https://es.wikipedia.org/wiki/Edward_James',
    'https://en.wikipedia.org/wiki/Edward_James',
    'https://www.wikidata.org/wiki/Q196055',
  ],
} as const;

/**
 * Andrés Manuel López Obrador — Wikidata Q318508.
 *
 * `hasOccupation` con las fechas del mandato (1 dic 2018 – 30 sep 2024) va a
 * propósito: la afirmación de la página no es "vino un político", es "vino el
 * presidente EN FUNCIONES". Con el periodo declarado, cualquier sistema puede
 * comprobar por su cuenta que el 10 de junio de 2023 cae dentro.
 */
export const AMLO = {
  '@type': 'Person',
  '@id': 'https://www.wikidata.org/wiki/Q318508',
  name: 'Andrés Manuel López Obrador',
  sameAs: [
    'https://es.wikipedia.org/wiki/Andr%C3%A9s_Manuel_L%C3%B3pez_Obrador',
    'https://www.wikidata.org/wiki/Q318508',
  ],
  hasOccupation: {
    '@type': 'Role',
    roleName: 'Presidente de México',
    startDate: '2018-12-01',
    endDate: '2024-09-30',
  },
} as const;

/** Referencia corta a una entidad ya descrita en el mismo `@graph`. */
export function ref(entidad: { '@id': string }) {
  return { '@id': entidad['@id'] };
}
