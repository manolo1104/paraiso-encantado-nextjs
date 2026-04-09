/**
 * Optimización de imágenes para Paraiso Encantado
 * Estrategia: Lazy loading, responsive sizes, WebP format
 */

export const imageOptimization = {
  // Configuración para hero images
  hero: {
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px",
    priority: true,
    quality: 85,
  },

  // Configuración para room cards
  roomCard: {
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    priority: false,
    quality: 80,
  },

  // Configuración para thumbnails
  thumbnail: {
    sizes: "(max-width: 768px) 100vw, 50vw",
    priority: false,
    quality: 75,
  },

  // Configuración para gallery
  gallery: {
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    priority: false,
    quality: 80,
  },
};

// Función helper para URLs de imágenes optimizadas
export function getOptimizedImageUrl(path: string, width: number = 800): string {
  // Si está usando Next.js Image Optimization
  return `/_next/image?url=${encodeURIComponent(path)}&w=${width}&q=80`;
}

// Placeholder de baja resolución para blur effect
export const placeholders = {
  room: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%232d5a3d' width='400' height='300'/%3E%3C/svg%3E",
  gallery: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%234a7c5c' width='800' height='600'/%3E%3C/svg%3E",
};
