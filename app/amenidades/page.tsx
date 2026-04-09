

import { amenities, hotelInfo } from '@/lib/data';

export const metadata = {
  title: 'Amenidades | Paraiso Encantado',
  description: 'Descubre todas las amenidades y servicios de lujo en Paraiso Encantado: piscina spa, restaurante, WiFi, tours y más.',
};

export default function AmenidadesPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-80 md:h-96 bg-gradient-to-r from-jade via-brote to-selva flex items-center justify-center">
        <div className="absolute inset-0 bg-black/25"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Amenidades
          </h1>
          <p className="font-body text-lg md:text-xl text-pergamino max-w-2xl mx-auto px-4">
            Lujo y confort en cada detalle
          </p>
        </div>
      </section>

      {/* Amenidades Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {amenities.map((amenity) => (
              <div
                key={amenity.id}
                className="p-8 border-2 border-jade rounded-lg hover:shadow-xl transition-shadow duration-300 hover:border-brote"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-jade to-brote rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-2xl">🏨</span>
                </div>
                <h3 className="font-display text-2xl text-selva mb-3">
                  {amenity.name}
                </h3>
                <p className="font-body text-gray-700 leading-relaxed">
                  {amenity.description}
                </p>
              </div>
            ))}
          </div>

          {/* Details Section */}
          <div className="bg-pergamino rounded-lg p-8 md:p-12">
            <h2 className="font-display text-3xl text-selva mb-8 text-center">
              Más sobre nuestros servicios
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Restaurant */}
              <div>
                <h3 className="font-display text-2xl text-jade mb-4">
                  🍽️ Restaurante El Papán Huasteco
                </h3>
                <p className="font-body text-gray-700 mb-4">
                  Disfruta de la auténtica gastronomía huasteca en nuestro restaurante al aire libre. Platillos caseros con sazón tradicional, tortillas hechas a mano en comal.
                </p>
                <p className="font-body text-sm text-gray-600">
                  <strong>Horario:</strong> Desayuno 7:00-10:00 | Comida 13:00-16:00 | Cena 19:00-22:00
                </p>
              </div>

              {/* Activities */}
              <div>
                <h3 className="font-display text-2xl text-jade mb-4">
                  🥾 Tours y Actividades
                </h3>
                <p className="font-body text-gray-700 mb-4">
                  Explora la Huasteca Potosina con nuestros tours especializados. Desde caminatas por la selva hasta visitas al Jardín Surrealista de Edward James.
                </p>
                <p className="font-body text-sm text-gray-600">
                  Consulta con nuestro equipo para personalizar tu experiencia.
                </p>
              </div>

              {/* Wellness */}
              <div>
                <h3 className="font-display text-2xl text-jade mb-4">
                  💆 Spa y Wellness
                </h3>
                <p className="font-body text-gray-700 mb-4">
                  Relájate en nuestra piscina spa con vistas a la selva. Masajes y tratamientos naturales disponibles bajo demanda.
                </p>
                <p className="font-body text-sm text-gray-600">
                  Reserva tu sesión de bienestar.
                </p>
              </div>

              {/* Connectivity */}
              <div>
                <h3 className="font-display text-2xl text-jade mb-4">
                  📶 Conectividad
                </h3>
                <p className="font-body text-gray-700 mb-4">
                  WiFi de alta velocidad en todas las áreas. Espacio de trabajo disponible para nómadas digitales.
                </p>
                <p className="font-body text-sm text-gray-600">
                  Conexión confiable para tu productividad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Box */}
      <section className="py-16 bg-gradient-to-r from-selva to-jade text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            ¿Preguntas sobre nuestras amenidades?
          </h2>
          <p className="font-body text-lg mb-8 text-pergamino">
            Contáctanos para obtener más información
          </p>
          <a
            href={`tel:${hotelInfo.contact.phone}`}
            className="inline-block bg-brote hover:bg-ambar text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Llamar ahora
          </a>
        </div>
      </section>
    </main>
  );
}
