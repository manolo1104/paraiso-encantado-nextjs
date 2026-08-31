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
 */
export const ENTITY_IDS = {
  hotel: 'https://www.paraisoencantado.com/#hotel',
  website: 'https://www.paraisoencantado.com/#website',
  organization: 'https://www.paraisoencantado.com/#organization',
} as const;

export const HOTEL_REF = { '@id': ENTITY_IDS.hotel } as const;

/** Perfiles públicos del hotel, para `sameAs`. */
export const PERFILES_HOTEL = [
  'https://www.instagram.com/_paraiso_encantado/',
  'https://www.facebook.com/cabanas.encantado/',
  'https://www.youtube.com/@hotelparaisoencantadoxilit8111',
  'https://www.linkedin.com/company/hotel-paraiso-encantado-xilitla/',
  'https://g.page/r/CY84xO7VaxDbEBM',
] as const;

/** Las Pozas / Jardín Escultórico Edward James — Wikidata Q11688402. */
export const LAS_POZAS = {
  '@type': 'TouristAttraction',
  '@id': 'https://www.wikidata.org/wiki/Q11688402',
  name: 'Las Pozas — Jardín Escultórico Edward James',
  description:
    'Conjunto surrealista de 37 hectáreas y 27 estructuras creado por Edward James en Xilitla entre 1962 y 1984. Abierto al público en 1991 y declarado patrimonio artístico nacional por el INBA en 2012.',
  sameAs: [
    'https://es.wikipedia.org/wiki/Las_Pozas',
    'https://www.wikidata.org/wiki/Q11688402',
  ],
  geo: { '@type': 'GeoCoordinates', latitude: 21.387, longitude: -98.994 },
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
  sameAs: [
    'https://es.wikipedia.org/wiki/Edward_James',
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
