

import Link from 'next/link';
import { restaurantInfo } from '@/lib/data';

export const metadata = {
  title: 'El Papán Huasteco | Restaurante | Paraiso Encantado',
  description: 'Disfruta de auténtica gastronomía huasteca en El Papán Huasteco. Platillos caseros, tortillas hechas a mano y sazón tradicional.',
};

export default function RestaurantePage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-80 md:h-96 bg-gradient-to-r from-corteza via-ambar to-arena flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            El Papán Huasteco
          </h1>
          <p className="font-body text-lg md:text-xl text-pergamino max-w-2xl mx-auto px-4">
            Auténtica gastronomía de la Huasteca Potosina
          </p>
        </div>
      </section>

      {/* Restaurant Info */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Description */}
            <div>
              <h2 className="font-display text-3xl text-selva mb-6">
                Experiencia Culinaria Única
              </h2>
              <p className="font-body text-gray-700 mb-4 leading-relaxed">
                {restaurantInfo.description}
              </p>
              <p className="font-body text-gray-700 mb-4 leading-relaxed">
                Nuestro equipo culinario prepara cada platillo con ingredientes frescos y técnicas tradicionales. Desde tamales hasta mole, cada bocado es una explosión de sabor.
              </p>

              <div className="space-y-4 mt-8">
                <div>
                  <h3 className="font-display text-xl text-jade mb-2">📍 Ubicación</h3>
                  <p className="font-body text-gray-700">
                    Terraza al aire libre rodeada de naturaleza
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl text-jade mb-2">⏰ Horarios</h3>
                  <p className="font-body text-gray-700">
                    <strong>Desayuno:</strong> 7:00 - 10:00<br />
                    <strong>Comida:</strong> 13:00 - 16:00<br />
                    <strong>Cena:</strong> 19:00 - 22:00
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl text-jade mb-2">👥 Reservaciones</h3>
                  <p className="font-body text-gray-700">
                    Contáctanos para reservar una mesa especial
                  </p>
                </div>
              </div>
            </div>

            {/* Image/Info */}
            <div>
              <div className="h-96 bg-gradient-to-br from-ambar to-corteza rounded-lg mb-6"></div>
              <div className="bg-pergamino p-8 rounded-lg">
                <h3 className="font-display text-2xl text-selva mb-4">
                  Especialidades
                </h3>
                <ul className="font-body text-gray-700 space-y-3">
                  <li>🌮 Tamales huastecos</li>
                  <li>🍲 Mole negro tradicional</li>
                  <li>🐔 Pollo en pipián</li>
                  <li>🥘 Caldo de res</li>
                  <li>🌶️ Salsa casera</li>
                  <li>🥛 Bebidas tradicionales</li>
                  <li>🍰 Postres caseros</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Menu Section */}
          <div className="bg-gradient-to-r from-pergamino to-arena rounded-lg p-8 md:p-12 text-center">
            <h2 className="font-display text-3xl text-selva mb-4">
              Menú Completo
            </h2>
            <p className="font-body text-gray-700 mb-6">
              Descarga nuestro menú PDF para conocer todos nuestros platillos y bebidas
            </p>
            <a
              href="/menu-papan-huasteco.pdf"
              className="inline-block bg-brote hover:bg-ambar text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              📥 Descargar Menú
            </a>
          </div>
        </div>
      </section>

      {/* Chef Info */}
      <section className="py-16 md:py-20 bg-white border-t-2 border-jade">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl text-selva mb-6">
              Cocinado con Pasión
            </h2>
            <p className="font-body text-gray-700 mb-8 leading-relaxed">
              Cada platillo en El Papán Huasteco es preparado con amor y respeto por las tradiciones culinarias de la región. Nuestros chefs combinan ingredientes locales con técnicas ancestrales para crear una experiencia gastronómica inolvidable.
            </p>
            <Link
              href="/contacto"
              className="inline-block bg-jade hover:bg-brote text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Hacer Reservación
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
