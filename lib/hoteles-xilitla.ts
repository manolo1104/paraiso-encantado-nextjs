/**
 * Los hoteles de Xilitla con los que nos comparamos, en un solo lugar.
 *
 * La tabla de /hoteles-en-xilitla y la respuesta «¿cuál es el hotel más cercano a
 * Las Pozas?» de /hotel-cerca-de-las-pozas leen de aquí, para que las dos páginas
 * no puedan decir cosas distintas. Ya pasó: hasta el 2 oct 2026 el sitio decía que
 * el más cercano era Paraíso Encantado mientras su propia tabla ponía Casa Caracol
 * a 300 m.
 *
 * Dos reglas que no se rompen aquí:
 *
 * 1. **Ningún dato inventado.** Tarifas y distancias salen de lo que cada hotel
 *    o los buscadores de hospedaje publicaban en septiembre de 2026. Donde no
 *    hubo fuente fiable va "Consultar", no una cifra aproximada: este es el
 *    sitio de un negocio real y publicar un precio falso de un competidor es un
 *    problema serio, no un detalle de SEO.
 * 2. **Sin enlaces a la competencia.** Se les nombra, igual que hacen las guías
 *    de viaje, porque una página que solo nombra un hotel no puede ser la
 *    respuesta a una búsqueda en plural. Pero los enlaces salientes hacia
 *    reservas de otros hoteles se regalarían sin recibir nada.
 *
 * La distancia de Paraíso Encantado sale de `HOTEL.metrosALasPozas`, que todavía
 * NO está medida a pie (ver lib/seo-hotel.ts): si la medición la cambia, se cambia
 * allá y aquí se actualiza sola.
 */

import { HOTEL } from '@/lib/seo-hotel';

/** Filas de la tabla comparativa: Hotel · Zona · Desde · A Las Pozas · Alberca · Estacionamiento. */
export const HOTELES_XILITLA: { cells: string[]; highlight?: boolean }[] = [
  { cells: ['Hotel Paraíso Encantado', 'La Conchita, camino a Las Pozas', `$${HOTEL.precioDesde.toLocaleString('es-MX')}`, `${HOTEL.metrosALasPozas} m · ${HOTEL.minutosCaminandoALasPozas} min a pie`, `Sí — y ${HOTEL.suitesConSpaPrivado} suites con spa privado`, 'Sí, gratuito'], highlight: true },
  { cells: ['Casa Caracol', 'Camino a Las Pozas', 'Consultar', '300 m · a pie', 'Sí', 'Consultar'] },
  { cells: ['Posada James', 'Camino a Las Pozas', '≈ $1,550', '8 min a pie', 'Sí', 'Sí, gratuito'] },
  { cells: ['Posada El Castillo', 'Centro, junto a la plaza', '≈ $1,900', 'Unos 2 km', 'Sí', 'Sí'] },
  { cells: ['Hotel Casablanca', 'Centro, a pie de la plaza', '≈ $1,300', 'Unos 2 km', 'Sí', 'Sí, gratuito'] },
  { cells: ['Hotel Sierra Linda', 'Centro, 5 min a pie de la plaza', '≈ $650', 'Unos 2 km', 'Sí', 'Sí, a una cuadra'] },
  { cells: ['Roof Top Hotel Xilitla', 'Centro, tras la plaza', '≈ $560', 'Unos 3 km', 'Sí, en la azotea', 'Sí'] },
  { cells: ['Hotel Real de Lua', 'Afueras, camino a Apetzco', '≈ $1,600', 'Unos 3 km', 'Sí', 'Sí, gratuito'] },
  { cells: ["Hotel Monte Ixk'al", 'Afueras, camino a San Antonio', '≈ $860', 'Unos 5 km', 'Sí', 'Sí, gratuito'] },
  { cells: ['Hotel Tapasoli', 'Apetzco, afueras', 'Desde $1,200', '15 min en auto', 'Sí', 'Sí, gratuito'] },
];

/**
 * Las mismas distancias de la tabla, dichas en una frase, para las respuestas de
 * texto. Si cambias una distancia en HOTELES_XILITLA, cámbiala también aquí:
 * están juntas para eso.
 *
 * Casa Caracol va primero porque es la más cercana según la tabla. Entre Paraíso
 * Encantado y Posada James no se afirma un orden: la nuestra todavía no está
 * medida a pie y la de Posada James está en minutos, no en metros.
 */
export const CAMINO_A_LAS_POZAS = {
  casaCaracol: 'a unos 300 metros',
  // Sin metros ni «de la entrada» (17 oct 2026): la distancia no está medida a pie y
  // las coordenadas dan 561 m en línea recta (ver lib/seo-hotel.ts). Esta frase sale
  // en tres respuestas; la cifra queda en la tabla, que sale de la constante.
  paraisoEncantado: `a unos ${HOTEL.minutosCaminandoALasPozas} minutos caminando del Jardín de Edward James`,
  posadaJames: 'a unos 8 minutos a pie',
} as const;
