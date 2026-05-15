// SERVER COMPONENT — exporta metadata y JSON-LD correctamente.
// La lógica interactiva (lightbox, filtros) está en GaleriaClient.tsx.
// NOTA SISTÉMICA: siempre separar server (metadata) de client ('use client').

import type { Metadata } from 'next';
import GaleriaClient from './GaleriaClient';

export const metadata: Metadata = {
  title: 'Galería de Fotos | Hotel Paraíso Encantado · Suites, Restaurante y Xilitla',
  description:
    'Explora en imágenes las 13 suites boutique, el restaurante El Papán Huasteco, la piscina, los jardines y los destinos naturales de la Huasteca Potosina desde Hotel Paraíso Encantado en Xilitla.',
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
        url: 'https://www.paraisoencantado.com/images/Areas comunes/DSC09456-HDR.jpg',
        width: 1200,
        height: 800,
        alt: 'Hotel Paraíso Encantado — Xilitla, Huasteca Potosina',
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
    'Galería fotográfica del Hotel Paraíso Encantado: 13 suites boutique con spa privado, restaurante El Papán Huasteco, jardines tropicales y destinos naturales de la Huasteca Potosina en Xilitla, San Luis Potosí.',
  url: 'https://www.paraisoencantado.com/galeria',
  author: {
    '@type': 'Organization',
    name: 'Hotel Paraíso Encantado',
    url: 'https://www.paraisoencantado.com',
  },
  about: {
    '@type': 'TouristAttraction',
    name: 'Hotel Paraíso Encantado',
    description: 'Hotel boutique en Xilitla a 5 minutos del Jardín de Edward James (Las Pozas)',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Xilitla',
      addressRegion: 'San Luis Potosí',
      addressCountry: 'MX',
    },
  },
  image: [
    {
      '@type': 'ImageObject',
      url: 'https://www.paraisoencantado.com/images/JUNGLA/PORTADA.JPG',
      name: 'Suite Jungla con piscina spa privada — Hotel Paraíso Encantado',
      description: 'Suite Jungla: santuario en la selva con piscina spa privada y vista a las montañas de Xilitla',
    },
    {
      '@type': 'ImageObject',
      url: 'https://www.paraisoencantado.com/images/Areas comunes/DSC09456-HDR.jpg',
      name: 'Fachada y piscina — Hotel Paraíso Encantado, Xilitla',
      description: 'Vista exterior del Hotel Paraíso Encantado con jardines tropicales en Xilitla, Huasteca Potosina',
    },
    {
      '@type': 'ImageObject',
      url: 'https://www.paraisoencantado.com/images/atracciones/jardin-edward-james-aerial.png',
      name: 'Jardín de Edward James — Las Pozas, Xilitla',
      description: 'Las Pozas de Edward James, jardín surrealista Patrimonio Cultural de México, a 5 min de Paraíso Encantado',
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

export default function GaleriaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gallerySchema) }}
      />
      <GaleriaClient />
    </>
  );
}
