// Citas curadas de las reseñas publicadas en /reviews (app/reviews/page.tsx).
// Extractos textuales — NO inventar ni editar el contenido; si se agregan,
// deben venir de esa misma fuente.
//
// 🔴 17 oct 2026: esas 25 reseñas NO están comprobadas contra la ficha de Google (ver
// el comentario de REVIEWS en app/reviews/page.tsx). Por eso /reservar ya no firma
// estas citas «Google» y el resumen del pago no cita ninguna. Hasta que Manolo enlace
// cada una con su reseña real (o las cambie por reseñas copiadas de la ficha), que
// ninguna página las presente como reseñas de Google.
//
// 17 oct 2026: salieron dos citas que se enseñaban en /reservar y que el sitio no
// puede sostener: la de Diana Muñiz («El hotel más cercano a Las Pozas y sin duda el
// mejor»; nuestra propia comparativa pone Casa Caracol más cerca) y la de Jorge
// Mendoza («El mejor hotel de Xilitla sin ninguna duda»; Posada James tiene mejor
// nota). Siguen en /reviews hasta que Manolo confirme cada reseña con su enlace.
// No se editó ninguna: se quitaron enteras. Patricia Vega pasa a ser la cita
// general (su texto no habla de una suite).

export interface ReviewQuote {
  name: string;
  location: string;
  rating: number;
  text: string;
  /** Nombre de la habitación en BOOKING_ROOMS a la que refiere (null = general) */
  room: string | null;
}

export const REVIEW_QUOTES: ReviewQuote[] = [
  {
    name: 'Patricia Vega', location: 'Querétaro', rating: 5, room: null,
    text: 'Llegamos tarde por tráfico y nos esperaron con la cena lista. Ese detalle lo dice todo sobre cómo tratan a sus huéspedes.',
  },
  {
    name: 'Ricardo Salazar', location: 'CDMX', rating: 5, room: 'Jungla',
    text: 'El spa privado de la Jungla es lo máximo — nos quedamos en él más tiempo que en Las Pozas.',
  },
  {
    name: 'Pablo Guerrero', location: 'Guadalajara', rating: 5, room: 'Suite LindaVista',
    text: 'La tina de hidromasaje con vista a la sierra es literalmente el lujo que esperaba.',
  },
  {
    name: 'Luis Hernández', location: 'Monterrey', rating: 5, room: 'Suite Flor de Liz 1',
    text: 'La suite tiene todo lo que necesitas y el spa privado es un plus que realmente se disfruta.',
  },
  {
    name: 'Valentina Torres', location: 'CDMX', rating: 5, room: 'Suite Flor de Liz 2',
    text: 'Luna de miel perfecta. La suite con spa privado entre la vegetación tropical, el silencio por las noches y el trato del personal hacen de este hotel algo único en México.',
  },
  {
    name: 'Sofía Ramírez', location: 'Querétaro', rating: 5, room: 'Suite Lajas',
    text: 'La vista desde Suite Lajas al atardecer — no tiene precio.',
  },
  {
    name: 'Isabel Morales', location: 'Guadalajara', rating: 4, room: 'Lirios 1',
    text: 'Las vistas al jardín desde Lirios 1 son preciosas. Volvería sin duda.',
  },
  {
    name: 'Tomás Vargas', location: 'Guadalajara', rating: 5, room: 'Lirios 2',
    text: 'La habitación Lirios 2 con el balcón privado es perfecta para los amaneceres.',
  },
  {
    name: 'Alejandro Ríos', location: 'Querétaro', rating: 5, room: 'Orquídeas Doble',
    text: 'Desde el momento del check-in te sientes bienvenido. Las Pozas de Edward James a 5 minutos es literalmente el mejor feature del hotel.',
  },
  {
    name: 'Natalia Cruz', location: 'Monterrey', rating: 5, room: 'Bromelias',
    text: 'Habitación amplia, limpia y con acceso directo a la piscina que es un bonus enorme.',
  },
  {
    name: 'Carlos Reyes', location: 'Monterrey', rating: 5, room: 'Helechos 1',
    text: 'Viajamos con familia numerosa y el hotel se acomodó perfectamente. La Suite Helechos 1 tiene espacio para todos.',
  },
  {
    name: 'Claudia Méndez', location: 'CDMX', rating: 5, room: 'Helechos 2',
    text: 'Venimos 6 personas y la suite Helechos 2 fue perfecta. Cuatro camas, espacio para todos, y estacionamiento para dos coches.',
  },
];

/** Cita específica de una suite; si no hay, una general (rotada por id para variar). */
export function getQuoteForRoom(roomName: string, roomId = 0): ReviewQuote {
  const exact = REVIEW_QUOTES.find(q => q.room === roomName);
  if (exact) return exact;
  const generals = REVIEW_QUOTES.filter(q => q.room === null);
  // Sin citas generales, `roomId % 0` daría NaN y /reservar pintaría `undefined`.
  const pool = generals.length ? generals : REVIEW_QUOTES;
  return pool[roomId % pool.length];
}

/**
 * Citas para la franja de reseñas de /reservar (la primera va también en la barra
 * lateral). Se buscan por nombre, no por posición: hasta el 17 oct 2026 eran
 * REVIEW_QUOTES[0..2] y quitar una cita cambiaba en silencio las que se ven.
 */
const CITAS_FRANJA = ['Patricia Vega', 'Claudia Méndez', 'Ricardo Salazar'];

export function getStripQuotes(): ReviewQuote[] {
  const citas = CITAS_FRANJA
    .map(nombre => REVIEW_QUOTES.find(q => q.name === nombre))
    .filter((q): q is ReviewQuote => Boolean(q));
  return citas.length ? citas : REVIEW_QUOTES.slice(0, 3);
}
