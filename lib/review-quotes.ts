// Citas curadas de las reseñas de Google publicadas en /reviews (app/reviews/page.tsx).
// Extractos textuales — NO inventar ni editar el contenido; si se agregan,
// deben venir de esa misma fuente. Rating real de cada autor.

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
    name: 'Diana Muñiz', location: 'Monterrey', rating: 5, room: null,
    text: 'Vine tres veces ya. Cada vez que llego me reciben como si hubiera faltado tiempo. El hotel más cercano a Las Pozas y sin duda el mejor.',
  },
  {
    name: 'Jorge Mendoza', location: 'Monterrey', rating: 5, room: null,
    text: 'El mejor hotel de Xilitla sin ninguna duda. Habitación impecable, restaurante excelente y ubicación perfecta. A 5 minutos caminando de Las Pozas.',
  },
  {
    name: 'Patricia Vega', location: 'Querétaro', rating: 5, room: 'Orquídeas 2',
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
  return generals[roomId % generals.length];
}

/** Citas generales para la franja de reseñas de /reservar */
export function getStripQuotes(): ReviewQuote[] {
  return [
    REVIEW_QUOTES[0], // Diana — "vine tres veces"
    REVIEW_QUOTES[1], // Jorge — "el mejor hotel de Xilitla"
    REVIEW_QUOTES[2], // Patricia — "nos esperaron con la cena lista"
  ];
}
