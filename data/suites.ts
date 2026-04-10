// ============================================
// DATA DE HABITACIONES — Paraíso Encantado
// Fuente: motor-de-reservas/public/hotel-paraiso-encantado-reservas.html
// Imágenes en: motor-de-reservas/public/images/
// ============================================

export interface Suite {
  id: string;
  name: string;
  category: string;
  categoryGroup: string;
  description: string;
  price: number; // precio base 2 personas (MXN/noche)
  maxOccupancy: number;
  amenities: string[];
  images: string[];
  featured?: boolean;
}

export const suites: Suite[] = [
  {
    id: 'jungla',
    name: 'Jungla',
    category: 'Suite Master',
    categoryGroup: 'Habitaciones Temáticas',
    description:
      'Un santuario inmerso en la selva con piscina de inmersión privada y exclusividad total.',
    price: 1900,
    maxOccupancy: 4,
    amenities: ['Piscina spa privada', 'Cama kingsize', 'Terraza privada', 'Vista montaña'],
    images: [
      '/images/JUNGLA/PORTADA.JPG',
      '/images/JUNGLA/DSCF1065.JPG',
      '/images/JUNGLA/DSCF1078.JPG',
      '/images/JUNGLA/DSCF1094.JPG',
    ],
    featured: true,
  },
  {
    id: 'lindavista',
    name: 'Suite LindaVista',
    category: 'Suite Master',
    categoryGroup: 'Suites con Vistas',
    description:
      'Inmersión total en el bosque con tina de hidromasaje y vistas ininterrumpidas desde las alturas.',
    price: 1900,
    maxOccupancy: 4,
    amenities: ['Hidromasaje', 'Cama kingsize', 'Terraza privada', 'Vistas panorámicas'],
    images: [
      '/images/LINDAVISTA/PORTADA.jpg',
      '/images/LINDAVISTA/Copia de DSC09539-HDR.jpg',
      '/images/LINDAVISTA/Copia de DSC09569.jpg',
      '/images/LINDAVISTA/Copia de IMG_0531.jpg',
    ],
    featured: true,
  },
  {
    id: 'flor-de-liz-1',
    name: 'Suite Flor de Liz 1',
    category: 'Suite Plus',
    categoryGroup: 'Suites Premium con Vistas',
    description:
      'Vistas panorámicas a la montaña y piscina spa personal al aire libre para detener el tiempo.',
    price: 1900,
    maxOccupancy: 4,
    amenities: ['Piscina spa', 'Terraza con vista', '2 Camas matrimoniales', 'WiFi'],
    images: [
      '/images/FLOR DE LIS 1/PORTADA.jpg',
      '/images/FLOR DE LIS 1/DSCF1191.JPG',
      '/images/FLOR DE LIS 1/DSCF1312.jpeg',
    ],
    featured: true,
  },
  {
    id: 'flor-de-liz-2',
    name: 'Suite Flor de Liz 2',
    category: 'Suite Plus',
    categoryGroup: 'Suites Premium con Vistas',
    description:
      'Relajación profunda con tu propia piscina spa y atardeceres incomparables sobre el pueblo.',
    price: 1900,
    maxOccupancy: 4,
    amenities: ['Piscina spa', 'Terraza con vista', '2 Camas matrimoniales', 'WiFi'],
    images: [
      '/images/FLOR DE LIS 2/PORTADA.jpeg',
      '/images/FLOR DE LIS 2/DSCF1191.JPG',
    ],
    featured: false,
  },
  {
    id: 'lajas',
    name: 'Suite Lajas',
    category: 'Suite Standard',
    categoryGroup: 'Habitaciones Temáticas',
    description:
      'Amplitud elegante con sala de estar y terraza frente al majestuoso paisaje de Xilitla.',
    price: 1900,
    maxOccupancy: 4,
    amenities: ['Sala de estar', '2 Baños completos', 'Terraza privada', 'Vista panorámica'],
    images: [
      '/images/LAJAS/PORTADA.jpg',
      '/images/LAJAS/Copia de DSC09589-HDR.jpg',
      '/images/LAJAS/Copia de DSC09610-HDR.jpg',
    ],
    featured: true,
  },
  {
    id: 'helechos-1',
    name: 'Helechos 1',
    category: 'Suite Familiar',
    categoryGroup: 'Habitaciones Estándar',
    description:
      'El espacio perfecto para la familia, combinando comodidad compartida y acceso a la piscina.',
    price: 1900,
    maxOccupancy: 6,
    amenities: ['3 Camas matrimoniales', 'Terraza común', 'Piscina', 'WiFi'],
    images: [
      '/images/HELECHOS 1/PORTADA.jpg',
      '/images/HELECHOS 1/Copia de DSC09461-HDR 2.jpg',
      '/images/HELECHOS 1/Copia de DSC09526-HDR.jpg',
    ],
    featured: false,
  },
  {
    id: 'helechos-2',
    name: 'Helechos 2',
    category: 'Suite Familiar Plus',
    categoryGroup: 'Habitaciones Estándar',
    description:
      'El refugio ideal para grupos grandes, con amplia convivencia y vistas a la naturaleza.',
    price: 1900,
    maxOccupancy: 8,
    amenities: ['4 Camas matrimoniales', 'Terraza común', 'Piscina', 'WiFi'],
    images: [
      '/images/HELECHOS 2/PORTADA.jpg',
      '/images/HELECHOS 2/Copia de DSC09461-HDR.jpg',
    ],
    featured: false,
  },
  {
    id: 'lirios-1',
    name: 'Lirios 1',
    category: 'Standard',
    categoryGroup: 'Habitaciones Dobles',
    description:
      'Desconexión total y descanso reparador en un espacio abrazado por la vegetación.',
    price: 1500,
    maxOccupancy: 4,
    amenities: ['Vista jardín y selva', '2 Camas matrimoniales', 'A/C', 'WiFi'],
    images: [
      '/images/LIRIOS 1/PORTADA.jpg',
      '/images/LIRIOS 1/Copia de DSC09524-HDR.jpg',
      '/images/LIRIOS 1/Copia de DSCF1620.jpg',
    ],
    featured: true,
  },
  {
    id: 'lirios-2',
    name: 'Lirios 2',
    category: 'Standard Plus',
    categoryGroup: 'Habitaciones Dobles',
    description:
      'Un rincón de paz y silencio absoluto con balcón privado hacia los jardines.',
    price: 1500,
    maxOccupancy: 4,
    amenities: ['Balcón privado', 'Vista jardines', '2 Camas matrimoniales', 'WiFi'],
    images: [
      '/images/LIRIOS 2/PORTADA.jpg',
      '/images/LIRIOS 2/Copia de DSC09483-HDR.jpg',
    ],
    featured: false,
  },
  {
    id: 'orquideas-2',
    name: 'Orquídeas 2',
    category: 'Superior King',
    categoryGroup: 'Habitaciones Familiares',
    description:
      'Confort superior en cama King Size con perspectiva elevada y vibrante de la selva.',
    price: 1500,
    maxOccupancy: 2,
    amenities: ['Cama kingsize', 'Terraza con vista a piscina', 'Baño completo', 'WiFi'],
    images: [
      '/images/ORQUIDEAS 2/PORTADA.jpg',
      '/images/ORQUIDEAS 2/DSCF1607.jpg',
    ],
    featured: false,
  },
  {
    id: 'orquideas-doble',
    name: 'Orquídeas Doble',
    category: 'Superior King',
    categoryGroup: 'Habitaciones Familiares',
    description:
      'Amplitud y comodidad para cuatro, con terraza compartida con vistas a la piscina.',
    price: 1500,
    maxOccupancy: 4,
    amenities: ['2 Camas matrimoniales', 'Terraza con vista a piscina', 'A/C', 'WiFi'],
    images: [
      '/images/ORQUIDEAS DOBLE/PORTADA.jpg',
      '/images/ORQUIDEAS DOBLE/Copia de DSC09602-HDR.jpg',
    ],
    featured: false,
  },
  {
    id: 'orquideas-3',
    name: 'Orquídeas 3',
    category: 'Superior King',
    categoryGroup: 'Habitaciones Familiares',
    description:
      'Vista elevada de la selva desde una King Size, paz absoluta y acceso a la piscina común.',
    price: 1500,
    maxOccupancy: 2,
    amenities: ['Cama kingsize', 'Vista selva', 'Terraza común', 'WiFi'],
    images: [
      '/images/ORQUIDEAS 3/PORTADA.jpg',
      '/images/ORQUIDEAS 3/DSCF1612.jpg',
    ],
    featured: false,
  },
  {
    id: 'bromelias',
    name: 'Bromelias',
    category: 'Standard Plus',
    categoryGroup: 'Habitaciones Estándar',
    description:
      'Diseño contemporáneo en planta baja con acceso fluido a la piscina y áreas de descanso.',
    price: 1500,
    maxOccupancy: 4,
    amenities: ['Planta baja', 'Acceso directo piscina', '2 Camas matrimoniales', 'WiFi'],
    images: [
      '/images/BROMELIAS 1/PORTADA.jpg',
      '/images/BROMELIAS 1/Copia de DSC09385-HDR.jpg',
      '/images/BROMELIAS 1/Copia de DSC09431.jpg',
    ],
    featured: false,
  },
];

export const featuredSuites = suites.filter((s) => s.featured);
