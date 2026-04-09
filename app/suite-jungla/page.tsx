

import Link from 'next/link';
import { rooms } from '@/lib/data';

export default function SuiteJunglaPage() {
  const room = rooms.find((r) => r.id === 'jungla');

  if (!room) {
    return <div>Suite no encontrada</div>;
  }

  return (
    <>
      {/* Hero Gallery Section */}
      <section className="relative h-96 md:h-[500px] w-full overflow-hidden bg-gradient-to-br from-green-800 to-teal-700">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full w-full flex items-center justify-center">
          <div className="text-center text-white z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-2">{room.name}</h1>
            <p className="text-xl text-gray-100">{room.type}</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Description */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Descripción</h2>
              <p className="text-lg text-gray-700 leading-relaxed">{room.description}</p>
            </div>

            {/* Gallery Placeholder */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Galería</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {room.images.map((image, idx) => (
                  <div
                    key={idx}
                    className="aspect-video rounded-lg bg-gradient-to-br from-green-600 to-teal-500 overflow-hidden group cursor-pointer"
                  >
                    <div className="w-full h-full flex items-center justify-center text-white/50 group-hover:text-white/70 transition-colors">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Amenidades</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {room.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-jade-50 rounded-lg">
                    <span className="text-jade-600 text-xl">✓</span>
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              {/* Price */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-gray-600 text-sm mb-1">Tarifa por noche</p>
                <p className="text-4xl font-bold text-amber-700">${room.price}</p>
              </div>

              {/* Room Details */}
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-gray-600 text-sm">Tipo de cama</p>
                  <p className="font-semibold text-gray-900">{room.bedType}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Huéspedes máximo</p>
                  <p className="font-semibold text-gray-900">{room.maxGuests} personas</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Categoría</p>
                  <p className="font-semibold text-gray-900">{room.type}</p>
                </div>
              </div>

              {/* Availability Info */}
              <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm font-semibold">✓ Disponible</p>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <button className="w-full bg-jade-600 hover:bg-jade-700 text-white font-bold py-3 rounded-lg transition-colors duration-200">
                  Reservar Ahora
                </button>
                <Link
                  href="/contacto"
                  className="block text-center px-4 py-3 border-2 border-jade-600 text-jade-600 font-bold rounded-lg hover:bg-jade-50 transition-colors duration-200"
                >
                  Consultar Disponibilidad
                </Link>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>🚫</span>
                  <span>Política flexible de cancelación</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Check-in 15:00 | Check-out 12:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Rooms Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Otras Suites Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms
              .filter((r) => r.id !== 'jungla')
              .slice(0, 3)
              .map((relatedRoom) => (
                <Link key={relatedRoom.id} href={`/suite-${relatedRoom.id}`}>
                  <div className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full flex flex-col">
                    <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-600 group-hover:opacity-90 transition-opacity" />
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{relatedRoom.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{relatedRoom.type}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{relatedRoom.description}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-2xl font-bold text-amber-700">${relatedRoom.price}</p>
                        <p className="text-xs text-gray-500">por noche</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-jade-600 to-selva-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Te gustó esta suite?</h2>
          <p className="text-white/90 mb-6">Reserva ahora y disfruta de una experiencia única</p>
          <Link
            href="/contacto"
            className="inline-block px-8 py-3 bg-white text-jade-600 font-bold rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Reservar
          </Link>
        </div>
      </section>
    </>
  );
}
