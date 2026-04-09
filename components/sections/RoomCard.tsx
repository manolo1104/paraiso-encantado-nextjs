'use client';

import Link from 'next/link';
import Image from 'next/image';

interface RoomCardProps {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  maxGuests: number;
  bedType: string;
  images: string[];
}

export default function RoomCard({ id, name, type, description, price, maxGuests, bedType, images }: RoomCardProps) {
  // Usar gradients si las imágenes no existen
  const gradientMap: Record<string, string> = {
    jungla: 'from-green-800 to-teal-700',
    bosque: 'from-lime-700 to-green-600',
    musgo: 'from-emerald-600 to-teal-500',
    jade: 'from-cyan-600 to-blue-500',
    brote: 'from-yellow-600 to-amber-500',
    arena: 'from-orange-600 to-yellow-500',
    pergamino: 'from-amber-700 to-orange-600',
    ambar: 'from-amber-800 to-red-700',
    corteza: 'from-amber-900 to-brown-800',
    gold: 'from-yellow-600 to-orange-500',
    cascada: 'from-blue-700 to-cyan-600',
    rio: 'from-blue-800 to-teal-700',
    mirador: 'from-purple-700 to-pink-600',
    secreto: 'from-indigo-700 to-purple-600',
    eden: 'from-rose-700 to-purple-600',
  };

  const gradient = gradientMap[id] || 'from-gray-700 to-gray-600';

  return (
    <Link href={`/suite-${id}`}>
      <div className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col bg-white">
        {/* Image/Gradient Area */}
        <div className={`relative h-64 w-full bg-gradient-to-br ${gradient} overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-sm text-gray-100">{type}</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow p-4 flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
            
            {/* Details */}
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Cama:</span>
                <span>{bedType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Huéspedes:</span>
                <span>Hasta {maxGuests}</span>
              </div>
            </div>
          </div>

          {/* Price and CTA */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Desde</p>
                <p className="text-2xl font-bold text-amber-700">${price}</p>
                <p className="text-xs text-gray-500">por noche</p>
              </div>
              <button className="px-4 py-2 bg-jade-600 hover:bg-jade-700 text-white rounded-lg font-semibold transition-colors duration-200">
                Ver Más
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
