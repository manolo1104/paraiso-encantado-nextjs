

import { hotelInfo } from '@/lib/data';

export const metadata = {
  title: 'Ubicación | Paraiso Encantado',
  description: 'Encuentra Paraiso Encantado en Xilitla, Huasteca Potosina. A 7 minutos del centro y cerca del Jardín Surrealista Edward James.',
};

export default function UbicacionPage() {
  return (
    <main className="w-full">
      {/* Hero */}
      <section className="relative w-full h-80 md:h-96 bg-gradient-to-r from-jade to-bosque flex items-center justify-center">
        <div className="absolute inset-0 bg-black/25"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Ubicación
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <h2 className="font-display text-3xl text-selva mb-8">
                Encuéntranos
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="font-display text-xl text-jade mb-2">
                    📍 Dirección
                  </h3>
                  <p className="font-body text-gray-700">
                    {hotelInfo.location.address}
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl text-jade mb-2">
                    📞 Teléfono
                  </h3>
                  <a
                    href={`tel:${hotelInfo.contact.phone}`}
                    className="font-body text-brote hover:text-ambar font-semibold"
                  >
                    {hotelInfo.contact.phone}
                  </a>
                </div>

                <div>
                  <h3 className="font-display text-xl text-jade mb-2">
                    ✉️ Email
                  </h3>
                  <a
                    href={`mailto:${hotelInfo.contact.email}`}
                    className="font-body text-brote hover:text-ambar font-semibold"
                  >
                    {hotelInfo.contact.email}
                  </a>
                </div>

                <div>
                  <h3 className="font-display text-xl text-jade mb-2">
                    🗺️ Coordenadas
                  </h3>
                  <p className="font-body text-gray-700">
                    {hotelInfo.location.coordinates.lat + ", " + hotelInfo.location.coordinates.lng}
                  </p>
                </div>

                <div className="bg-pergamino p-6 rounded-lg">
                  <h3 className="font-display text-lg text-selva mb-3">
                    ¿Cómo llegar?
                  </h3>
                  <ul className="font-body text-gray-700 space-y-2">
                    <li>• <strong>Desde Xilitla centro:</strong> 7 minutos en coche</li>
                    <li>• <strong>Desde Aeropuerto San Luis Potosí:</strong> 2 horas</li>
                    <li>• <strong>Desde Ciudad de México:</strong> 3.5 horas</li>
                    <li>• <strong>Desde Tampico:</strong> 2 horas</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Map */}
            <div>
              <div className="w-full h-96 bg-gradient-to-br from-jade to-brote rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="font-display text-2xl mb-2">🗺️</p>
                  <p className="font-body">
                    Mapa interactivo<br />
                    <span className="text-sm">Próximamente</span>
                  </p>
                </div>
              </div>

              <div className="mt-8 bg-pergamino p-6 rounded-lg">
                <h3 className="font-display text-lg text-selva mb-4">
                  Puntos de Referencia
                </h3>
                <ul className="font-body text-gray-700 space-y-2">
                  <li>✓ A pasos del Jardín Surrialista Edward James</li>
                  <li>✓ Cerca de las Pozas de Agua Fría</li>
                  <li>✓ Próximo a Cascada del Salto</li>
                  <li>✓ Centro de Xilitla a 5 km</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-selva to-jade text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-3xl mb-4">
            ¿Listo para visitarnos?
          </h2>
          <a
            href="/booking"
            className="inline-block bg-brote hover:bg-ambar text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Reservar ahora
          </a>
        </div>
      </section>
    </main>
  );
}
