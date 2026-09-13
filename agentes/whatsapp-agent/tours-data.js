/**
 * tours-data.js
 * Catálogo de los 10 tours del equipo de tours (Tours Huasteca Potosina).
 *
 * Fuente canónica: repo "INTINERARIO HUASTECA", rama main — src/lib/tours.ts y
 * whatsapp-bot/data.json (generado el 11 sep 2026). Si cambia un precio allá,
 * se cambia aquí; nada de este archivo se inventa.
 *
 * Los tours NO entran en la cotización del hotel: Camila solo informa y manda al
 * cliente con el equipo de tours (WhatsApp y links).
 */

export const TOURS_WHATSAPP = '+52 489 125 1458';
export const TOURS_WA_DIGITS = '524891251458';
export const TOURS_BASE_URL = 'https://www.huasteca-potosina.com';
export const TOURS_LIST_URL = `${TOURS_BASE_URL}/tours`;
export const PACKAGES_URL = `${TOURS_BASE_URL}/paquetes`;

// data.json → info.ninos: "Niños 6–10 años: 70 % del precio adulto. Menores de 6: 50 %.
// (No aplica a tours por vehículo ni al buceo, que es solo para mayores de 10.)"
export const TOURS_KIDS_RULE = 'Niños de 6 a 10 años pagan 70% y menores de 6 el 50% (no aplica en RZR ni en buceo)';

// data.json → info.cancelacion
export const TOURS_CANCEL_RULE = 'Cancelación gratis hasta 48 h antes';

const tourUrl = (id) => `${TOURS_BASE_URL}/tours/${id}`;

// Textos repetidos (tours de día completo con traslado y desayuno en ruta)
const PICKUP_XILITLA_VALLES = 'Traslado redondo desde tu hospedaje en Xilitla o Ciudad Valles';
const BREAKFAST_ON_ROUTE = 'Desayuno buffet en ruta (El Taco Loco, no en el hotel); la comida de mediodía no está incluida';
const NO_MEALS = 'No incluye alimentos';

/**
 * @typedef {Object} Tour
 * @property {string} id             slug canónico (el de la URL)
 * @property {string} name
 * @property {number} price          MXN (RZR: precio desde, por vehículo)
 * @property {string} priceText
 * @property {string} duration
 * @property {number} minPeople
 * @property {number} maxPeople
 * @property {string[]} destinations
 * @property {string} logistics      transporte / punto de salida
 * @property {string} meals
 * @property {string} notes
 * @property {string} url
 * @property {string[]} keywords     en minúsculas y sin acentos, para detectar menciones
 */

/** @type {Tour[]} */
export const TOURS = [
  {
    id: 'expedicion-tamul',
    name: 'Expedición Tamul',
    price: 1550,
    priceText: '$1,550 MXN por persona',
    duration: '8–10 h',
    minPeople: 2,
    maxPeople: 14,
    destinations: ['Cascada de Tamul (paseo en canoa)', 'Cenote Cueva del Agua', 'Sótano de las Huahuas al atardecer'],
    logistics: `${PICKUP_XILITLA_VALLES}. Inicia aprox. 8:30 a.m.`,
    meals: BREAKFAST_ON_ROUTE,
    notes: 'Incluye entradas, paseo en canoa por el Cañón del Tampaón, guía certificado NOM-09 y equipo de seguridad',
    url: tourUrl('expedicion-tamul'),
    keywords: ['tamul', 'expedicion tamul', 'cueva del agua', 'huahuas'],
  },
  {
    id: 'ruta-surrealista-edward-james',
    name: 'Ruta Surrealista',
    price: 1400,
    priceText: '$1,400 MXN por persona',
    duration: '8–10 h',
    minPeople: 2,
    maxPeople: 14,
    destinations: ['Jardín Surrealista Edward James (Las Pozas)', 'Nacimiento de Huichihuayán', 'Cueva de las Quilas', 'Castillo de la Salud'],
    logistics: `${PICKUP_XILITLA_VALLES}. Inicia aprox. 8:30 a.m.`,
    meals: BREAKFAST_ON_ROUTE,
    notes: 'Incluye entradas y guía certificado NOM-09 especializado en historia y cultura',
    url: tourUrl('ruta-surrealista-edward-james'),
    // Sin "edward james", "las pozas" ni "xilitla": son la ubicación del hotel.
    keywords: ['ruta surrealista', 'huichihuayan', 'cueva de las quilas', 'castillo de la salud'],
  },
  {
    id: 'cascadas-del-meco',
    name: 'Cascadas del Meco',
    price: 1700,
    priceText: '$1,700 MXN por persona',
    duration: '10 h',
    minPeople: 2,
    maxPeople: 14,
    destinations: ['Cascada del Meco', 'Mirador Panorámico del Meco', 'Cascada El Salto'],
    logistics: `${PICKUP_XILITLA_VALLES}. Inicia aprox. 8:30 a.m. y termina aprox. 6:30 p.m.`,
    meals: BREAKFAST_ON_ROUTE,
    notes: 'Incluye entradas, guía certificado NOM-09 y equipo de seguridad',
    url: tourUrl('cascadas-del-meco'),
    keywords: ['meco', 'cascada el salto', 'cascada del salto'],
  },
  {
    id: 'paraiso-escalonado-minas-micos',
    name: 'Paraíso Escalonado',
    price: 1600,
    priceText: '$1,600 MXN por persona',
    duration: '10 h',
    minPeople: 2,
    maxPeople: 14,
    destinations: ['Cascadas de Minas Viejas', 'Cascadas de Micos'],
    logistics: `${PICKUP_XILITLA_VALLES}. Inicia aprox. 8:30 a.m. y termina aprox. 6:30 p.m.`,
    meals: BREAKFAST_ON_ROUTE,
    notes: 'Opcional: Salto de las 7 Cascadas en Micos +$350 por persona. Incluye entradas, guía certificado NOM-09 y equipo de seguridad',
    url: tourUrl('paraiso-escalonado-minas-micos'),
    keywords: ['paraiso escalonado', 'minas viejas', 'micos'],
  },
  {
    id: 'ruta-acuatica-puente-de-dios',
    name: 'Ruta Acuática',
    price: 1600,
    priceText: '$1,600 MXN por persona',
    duration: '10 h',
    minPeople: 2,
    maxPeople: 14,
    destinations: ['Puente de Dios', 'A elegir: Hacienda Los Gómez + Siete Cascadas (mismo lugar) o Cascadas de Tamasopo'],
    logistics: `${PICKUP_XILITLA_VALLES}. Inicia aprox. 8:30 a.m. y termina aprox. 6:30 p.m.`,
    meals: BREAKFAST_ON_ROUTE,
    notes: 'En un día da para una de las dos opciones, no para ambas. Incluye entradas, guía certificado NOM-09 y equipo de seguridad',
    url: tourUrl('ruta-acuatica-puente-de-dios'),
    keywords: ['ruta acuatica', 'puente de dios', 'tamasopo', 'siete cascadas', '7 cascadas', 'hacienda los gomez'],
  },
  {
    id: 'rappel-tamul',
    name: 'Rappel en la Cascada de Tamul',
    price: 1700,
    priceText: '$1,700 MXN por persona',
    duration: '5 h',
    minPeople: 4,
    maxPeople: 10,
    destinations: ['Embarcadero del Río Tampaón', 'Pared de rappel frente a la Cascada de Tamul', 'Cañón del Río Tampaón'],
    logistics: 'No incluye transporte: el punto de encuentro es el embarcadero del Río Tampaón (llegas por tu cuenta o se coordina aparte con costo adicional). Inicia aprox. 8:30 a.m.',
    meals: NO_MEALS,
    notes: 'Mínimo 4 personas. Apto para principiantes; incluye equipo completo de rappel, guías de alta montaña certificados y video con dron',
    url: tourUrl('rappel-tamul'),
    keywords: ['rappel'],
  },
  {
    id: 'rafting-rio-tampaon',
    name: 'Rafting en el Río Tampaón',
    price: 1950,
    priceText: '$1,950 MXN por persona',
    duration: '7 h',
    minPeople: 5,
    maxPeople: 8,
    destinations: ['Embarcadero del Río Tampaón', '14 km de rápidos Clase III por el Río Tampaón', 'Cañón del Tampaón'],
    logistics: `${PICKUP_XILITLA_VALLES}. Inicia aprox. 8:30 a.m. y termina aprox. 3:30 p.m.`,
    meals: BREAKFAST_ON_ROUTE,
    notes: 'Mínimo 5 personas. No necesitas experiencia ni saber nadar. Sujeto al nivel del río: la salida se confirma al reservar',
    url: tourUrl('rafting-rio-tampaon'),
    keywords: ['rafting', 'tampaon'],
  },
  {
    id: 'rzr-xilitla',
    name: 'Recorrido en RZR por Xilitla',
    price: 1600,
    priceText: 'desde $1,600 MXN por vehículo',
    duration: '2–5 h',
    minPeople: 2,
    maxPeople: 6,
    destinations: [
      'Ruta Nanacatli (aldea de casitas de hongos) · 2 h',
      'Ruta Miradores · 3 h',
      'Ruta Nacimiento (con kayak) · 5 h',
      'Ruta Trinidad (bosque de niebla) · 5 h',
    ],
    logistics: 'Sale de la base del equipo de tours en Xilitla; no incluye transporte hasta la base. Inicia aprox. 8:30–9:00 a.m.',
    meals: NO_MEALS,
    notes: 'Precio por vehículo (no por persona) según ruta y unidad: Nanacatli desde $1,600, Miradores desde $2,600, Nacimiento y Trinidad desde $3,800. Incluye gasolina, casco, goggles y guía instructor; apto para principiantes',
    url: tourUrl('rzr-xilitla'),
    keywords: ['rzr', 'off road', 'off-road', 'offroad', 'todoterreno', 'nanacatli', 'aldea de los pitufos'],
  },
  {
    id: 'buceo-media-luna',
    name: 'Buceo en la Laguna de la Media Luna',
    price: 1300,
    priceText: '$1,300 MXN por persona',
    duration: '4 h',
    minPeople: 2,
    maxPeople: 10,
    destinations: ['Laguna de la Media Luna (Rioverde, San Luis Potosí)'],
    logistics: 'No incluye transporte: la actividad es en la Laguna de la Media Luna, en Rioverde (llegas por tu cuenta). Inicia aprox. 8:30 a.m. y termina aprox. 12:30 p.m.',
    meals: 'No incluye alimentos (en la laguna hay puestos y restaurantes)',
    notes: 'Solo mayores de 10 años con buena salud. No necesitas experiencia: instructor certificado PADI, equipo SCUBA e inmersión de 5 a 10 m. La entrada al parque se paga allá',
    url: tourUrl('buceo-media-luna'),
    keywords: ['buceo', 'bucear', 'media luna', 'scuba'],
  },
  {
    id: 'travesia-del-cafe',
    name: 'Travesía del Café',
    price: 900,
    priceText: '$900 MXN por persona',
    duration: '5 h',
    minPeople: 2,
    maxPeople: 12,
    destinations: ['Cafetal bajo sombra de la sierra de Xilitla', 'Patio de secado del grano', 'Tostaduría artesanal', 'Barra de cata'],
    logistics: 'Traslado redondo solo desde tu hospedaje en Xilitla (no recoge en Ciudad Valles); el camino a la finca es en RZR. Inicia aprox. 8:30 a.m.',
    meals: 'No incluye desayuno ni comida; incluye la cata de café recién tostado',
    notes: 'Recorrido tranquilo por la finca cafetalera y todo el proceso del café; apto para toda la familia',
    url: tourUrl('travesia-del-cafe'),
    // "café" suelto NO: el restaurante del hotel también sirve café.
    keywords: ['travesia del cafe', 'tour de cafe', 'tour del cafe', 'finca cafetalera', 'cafetal', 'cafetales', 'cata de cafe'],
  },
];

/**
 * Bloque de tours para el system prompt. Determinístico (sin fechas ni azar)
 * para no romper el caché del prompt.
 * @returns {string}
 */
export function renderToursForPrompt() {
  const tours = TOURS.map((t, i) => {
    const parts = [
      `${i + 1}. *${t.name}* — ${t.priceText} · ${t.duration} · grupos de ${t.minPeople} a ${t.maxPeople} personas`,
      `   Destinos: ${t.destinations.join(' + ')}`,
      `   Logística: ${t.logistics}`,
    ];
    if (t.meals) parts.push(`   Alimentos: ${t.meals}`);
    if (t.notes) parts.push(`   Notas: ${t.notes}`);
    parts.push(`   🔗 ${t.url}`);
    return parts.join('\n');
  }).join('\n');

  return [
    `CATÁLOGO OFICIAL DE TOURS (los opera nuestro equipo de tours; precios de ${TOURS_BASE_URL.replace('https://', '')}):`,
    tours,
    '',
    `- Niños: ${TOURS_KIDS_RULE}.`,
    '- Todos incluyen seguro de viaje y las fotos y video que toma el guía. Ningún tour es todo incluido: la comida de mediodía nunca está incluida.',
    `- ${TOURS_CANCEL_RULE}.`,
    '- Los tours NO entran en la cotización del hotel: da la información y manda al cliente con el equipo de tours.',
    `- Para organizar o reservar: WhatsApp del equipo de tours *${TOURS_WHATSAPP}* · todos los tours: ${TOURS_LIST_URL}`,
    `- Paquetes (tours + hospedaje): los arma el equipo de tours. NO des precios ni nombres de paquetes; manda el link ${PACKAGES_URL} y el WhatsApp *${TOURS_WHATSAPP}*.`,
  ].join('\n');
}
