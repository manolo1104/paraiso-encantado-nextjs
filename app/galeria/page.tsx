// SERVER COMPONENT — exporta metadata y JSON-LD correctamente.
// La lógica interactiva (lightbox, filtros) está en GaleriaClient.tsx.
// NOTA SISTÉMICA: siempre separar server (metadata) de client ('use client').

import type { Metadata } from 'next';
import GaleriaClient from './GaleriaClient';
import { HOTEL_REF } from '@/lib/seo-entidades';

export const metadata: Metadata = {
  // Aquí sí se conserva la marca: la única consulta de fotos que trae
  // impresiones es "hotel paraíso encantado xilitla fotos", o sea búsqueda de
  // marca. El gancho es la cantidad de fotos.
  title: 'Fotos del Hotel Paraíso Encantado en Xilitla · 50+ Reales',
  description:
    'Suites, albercas spa privadas, el restaurante El Papán y la selva de Xilitla en más de 50 fotos y videos reales. Mira el hotel antes de reservar.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/galeria',
  },
  openGraph: {
    title: 'Galería de Imágenes — Hotel Paraíso Encantado, Xilitla',
    description:
      '50+ fotos y videos de las suites, el restaurante El Papán, los jardines, Las Pozas de Edward James y las cascadas de la Huasteca Potosina.',
    url: 'https://www.paraisoencantado.com/galeria',
    images: [
      {
        url: '/og/galeria.jpg',
        width: 1200,
        height: 630,
        alt: 'Atardecer en el Hotel Paraíso Encantado — Xilitla, Huasteca Potosina',
      },
    ],
  },
};

// ImageGallery JSON-LD — permite a Google mostrar fotos en rich results
const gallerySchema = {
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  name: 'Galería de Fotos — Hotel Paraíso Encantado, Xilitla',
  description:
    'Galería fotográfica del Hotel Paraíso Encantado: 13 suites boutique, 4 con spa privado, restaurante El Papán Huasteco, jardines tropicales y destinos naturales de la Huasteca Potosina en Xilitla, San Luis Potosí.',
  url: 'https://www.paraisoencantado.com/galeria',
  // El mismo `#hotel` de todo el sitio (17 oct 2026): antes eran una Organization y
  // una TouristAttraction sin @id, o sea dos entidades más con el nombre del hotel.
  author: HOTEL_REF,
  about: HOTEL_REF,
  image: [
    {
      '@type': 'ImageObject',
      url: 'https://www.paraisoencantado.com/images/JUNGLA/PORTADA.JPG',
      name: 'Suite Jungla con piscina spa privada — Hotel Paraíso Encantado',
      description: 'Suite Jungla: santuario en la selva con piscina spa privada y vista a las montañas de Xilitla',
    },
    {
      '@type': 'ImageObject',
      url: 'https://www.paraisoencantado.com/images/Areas comunes/DSC09471-HDR.jpg',
      name: 'Fachada y piscina — Hotel Paraíso Encantado, Xilitla',
      description: 'Vista exterior del Hotel Paraíso Encantado con jardines tropicales en Xilitla, Huasteca Potosina',
    },
    {
      // Foto real (CC0) en lugar de la imagen hecha con IA que había (oct 2026). Con
      // contentUrl + license + creditText, Google Imágenes puede mostrar autor y licencia.
      '@type': 'ImageObject',
      url: 'https://www.paraisoencantado.com/images/las-pozas/columnas-las-pozas-edward-james-xilitla.jpg',
      contentUrl: 'https://www.paraisoencantado.com/images/las-pozas/columnas-las-pozas-edward-james-xilitla.jpg',
      name: 'Columnas de Las Pozas, el jardín de Edward James en Xilitla',
      description: 'Las Pozas de Edward James, jardín surrealista declarado Monumento Artístico en 2012, a 5 min a pie de Paraíso Encantado',
      creator: { '@type': 'Person', name: 'A01701823 SergioC' },
      creditText: 'A01701823 SergioC / Wikimedia Commons (CC0)',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/',
      acquireLicensePage:
        'https://commons.wikimedia.org/wiki/File:Lugar_de_Fantasia,_Jardin_de_Edward_James._Xilitla,_San_Luis_Potosi,_Mexico.jpg',
    },
    {
      '@type': 'ImageObject',
      url: 'https://www.paraisoencantado.com/images/RESTAURANTE/DSC09679.jpg',
      name: 'El Papán Huasteco — restaurante de cocina huasteca en Xilitla',
      description: 'Restaurante El Papán Huasteco: cocina auténtica de la Huasteca Potosina con vista al jardín tropical',
    },
    {
      '@type': 'ImageObject',
      url: 'https://www.paraisoencantado.com/images/atracciones/cascada_de_tamul.jpg',
      name: 'Cascada de Tamul — Huasteca Potosina',
      description: 'Cascada de Tamul, la más impresionante de San Luis Potosí, accesible en tour desde Paraíso Encantado',
    },
  ],
};

const galeriaBreadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
    { '@type': 'ListItem', position: 2, name: 'Galería de Fotos', item: 'https://www.paraisoencantado.com/galeria' },
  ],
};

export default function GaleriaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gallerySchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(galeriaBreadcrumbSchema) }} />
      <GaleriaClient />
    </>
  );
}
