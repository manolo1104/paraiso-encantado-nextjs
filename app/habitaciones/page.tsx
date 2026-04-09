'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { rooms } from '@/lib/data';

export default function HabitacionesPage() {
  const [selectedType, setSelectedType] = useState<string>('all');

  const roomTypes = ['all', ...new Set(rooms.map((r) => r.type))];

  const filteredRooms = useMemo(() => {
    if (selectedType === 'all') return rooms;
    return rooms.filter((r) => r.type === selectedType);
  }, [selectedType]);

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-80 md:h-96 bg-gradient-to-r from-selva via-jade to-bosque flex items-center justify-center">
        <div className="absolute inset-0 bg-black/25"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Nuestras Suites
          </h1>
          <p className="font-body text-lg md:text-xl text-pergamino max-w-2xl mx-auto px-4">
            15 espacios únicos, cada uno con su propia esencia y lujo
          </p>
        </div>
      </section>

      {/* Filters & Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          {/* Filters */}
          <div className="mb-12 flex flex-wrap gap-2 justify-center">
            {roomTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-5 py-2 rounded-full font-body font-semibold transition-all duration-200 ${
                  selectedType === type
                    ? 'bg-brote text-white shadow-lg'
                    : 'bg-pergamino text-selva hover:bg-arena'
                }`}
              >
                {type === 'all' ? 'Todas' : type}
              </button>
            ))}
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map((room) => (
              <Link key={room.id} href={`/habitaciones/${room.id}`}>
                <div className="group cursor-pointer h-full">
                  {/* Image */}
                  <div className="relative h-64 bg-gradient-to-br from-jade to-brote rounded-lg overflow-hidden mb-4">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white font-body font-semibold">Ver detalles →</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-display text-2xl text-selva group-hover:text-brote transition-colors">
                        {room.name}
                      </h3>
                      <p className="font-body text-sm text-gray-500">{room.type}</p>
                    </div>

                    <p className="font-body text-gray-700 text-sm line-clamp-2">
                      {room.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-arena">
                      <div>
                        <p className="font-body text-xs text-gray-500">Desde</p>
                        <p className="font-display text-2xl text-jade">${room.price}</p>
                        <p className="font-body text-xs text-gray-500">/noche</p>
                      </div>
                      <div className="text-right">
                        <p className="font-body text-xs text-gray-500">Capacidad</p>
                        <p className="font-display text-lg text-selva">{room.maxGuests}</p>
                        <p className="font-body text-xs text-gray-500">huéspedes</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="font-body text-xs text-brote font-semibold">
                        {room.bedType}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-selva to-jade text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            ¿Tu Suite Perfecta Espera?
          </h2>
          <p className="font-body text-lg mb-8 text-pergamino max-w-2xl mx-auto">
            Cada habitación en Paraiso Encantado es una experiencia única. Encuentra la tuya.
          </p>
          <Link
            href="/booking"
            className="inline-block bg-brote hover:bg-ambar text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Reservar Ahora
          </Link>
        </div>
      </section>
    </main>
  );
}
