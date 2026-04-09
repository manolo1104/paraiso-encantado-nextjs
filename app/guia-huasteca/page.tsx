

export const metadata = {
  title: 'Guía de la Huasteca Potosina | Paraiso Encantado',
  description: 'La guía definitiva de la Huasteca Potosina: atracciones, gastronomía, transporte y consejos para viajeros.',
};

export default function GuiaHuastecaPage() {
  return (
    <main className="w-full">
      {/* Hero */}
      <section className="relative w-full h-80 md:h-96 bg-gradient-to-r from-jade via-brote to-ambar flex items-center justify-center">
        <div className="absolute inset-0 bg-black/25"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Guía de la Huasteca Potosina
          </h1>
          <p className="font-body text-pergamino">La Guía Definitiva 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Jardín Edward James */}
            <div>
              <h2 className="font-display text-3xl text-selva mb-4">
                🌳 Jardín Surrealista Edward James
              </h2>
              <p className="font-body text-gray-700 mb-4">
                La joya de la Huasteca. Un jardín surrealista único en el mundo, diseñado por el poeta inglés Edward James. Camina entre construcciones imposibles, cascadas y la exuberant selva.
              </p>
              <ul className="font-body text-gray-700 space-y-2">
                <li>✓ Ubicado a 5 min de Paraiso Encantado</li>
                <li>✓ Horarios: 8:00 - 17:00</li>
                <li>✓ Entrada: $150 MXN aprox</li>
                <li>✓ Tours guiados disponibles</li>
              </ul>
            </div>

            {/* Cascadas */}
            <div>
              <h2 className="font-display text-3xl text-selva mb-4">
                💧 Cascadas y Pozas
              </h2>
              <p className="font-body text-gray-700 mb-4">
                La región es famosa por sus cascadas y piscinas naturales. Desde Cascada de Agua Fría hasta las Pozas de Agua Fría, la Huasteca es un paraíso acuático.
              </p>
              <ul className="font-body text-gray-700 space-y-2">
                <li>✓ Tours acuáticos desde el hotel</li>
                <li>✓ Repelling y rappelling</li>
                <li>✓ Fotografía natural</li>
                <li>✓ Baño en pozas cristalinas</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Gastronomía */}
            <div>
              <h2 className="font-display text-3xl text-selva mb-4">
                🍲 Gastronomía Huasteca
              </h2>
              <p className="font-body text-gray-700 mb-4">
                La Huasteca tiene una gastronomía única. Prueba los platillos típicos: tamales, mole, caldo de res, y pozole.
              </p>
              <ul className="font-body text-gray-700 space-y-2">
                <li>🌮 Tamales huastecos</li>
                <li>🍲 Caldo de camarón</li>
                <li>🐔 Mole negro</li>
                <li>🥛 Tejate (bebida tradicional)</li>
              </ul>
            </div>

            {/* Transporte */}
            <div>
              <h2 className="font-display text-3xl text-selva mb-4">
                🚗 Transporte y Movilidad
              </h2>
              <p className="font-body text-gray-700 mb-4">
                La mejor forma de explorar es con vehículo propio. Desde Paraiso Encantado puedes acceder a todos los puntos principales.
              </p>
              <ul className="font-body text-gray-700 space-y-2">
                <li>✓ Renta de autos en Xilitla</li>
                <li>✓ Tours con chofer disponibles</li>
                <li>✓ Carreteras en buen estado</li>
                <li>✓ Gasolina: +/- 15 min a pie</li>
              </ul>
            </div>
          </div>

          {/* Consejos */}
          <div className="bg-pergamino p-12 rounded-lg">
            <h2 className="font-display text-3xl text-selva mb-8">
              💡 Consejos para Viajeros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-display text-xl text-jade mb-3">Mejor época</h3>
                <p className="font-body text-gray-700">
                  Octubre a mayo. Menos lluvia y temperaturas agradables.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl text-jade mb-3">Qué llevar</h3>
                <p className="font-body text-gray-700">
                  Ropa cómoda, zapatos para senderismo, bloqueador, repelente y cámara.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl text-jade mb-3">Presupuesto</h3>
                <p className="font-body text-gray-700">
                  Los precios en la Huasteca son muy accesibles. Comida tipica desde $50 MXN.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl text-jade mb-3">Duración</h3>
                <p className="font-body text-gray-700">
                  Mínimo 3 días. Ideal 4-5 días para disfrutar completamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-jade to-brote text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Empieza tu aventura en la Huasteca
          </h2>
          <a
            href="/booking"
            className="inline-block bg-ambar hover:bg-gold text-selva font-body font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Reservar ahora
          </a>
        </div>
      </section>
    </main>
  );
}
