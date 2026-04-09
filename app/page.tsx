import Link from "next/link";
import Image from "next/image";
import { rooms, amenities } from "@/lib/data";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

// Real room images available in /public (folder → first image)
const roomImages: Record<string, string> = {
  jungla:  "/images/rooms/JUNGLA/IMG_5775.jpeg",
  bosque:  "/images/rooms/LAJAS/DSC09589-HDR.jpg",
  musgo:   "/images/rooms/LINDA-VISTA/DSC09538-HDR-2.jpg",
  jade:    "/images/rooms/BRO_1/DSC09385-HDR.jpg",
  brote:   "/images/rooms/BROMELIAS_2/IMG_8597.png",
  arena:   "/images/rooms/FDL1/DSC09449.jpg",
};

export default function Home() {
  return (
    <main className="w-full">
      <WhatsAppFloat />
      {/* Hero Section */}
      <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background photo */}
        <Image
          src="/images/rooms/JUNGLA/IMG_5775.jpeg"
          alt="Paraiso Encantado — Xilitla, Huasteca Potosina"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay — matches landing page */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(20,34,20,0.38) 0%, rgba(20,34,20,0.52) 55%, rgba(20,34,20,0.72) 100%)" }}
        />
        <div className="relative z-10 text-center text-white max-w-3xl mx-auto px-4">
          <p className="font-body text-xs tracking-[0.2em] uppercase text-ambar mb-4">
            Xilitla · Huasteca Potosina
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-4" style={{ color: "#f5f0e8" }}>
            Paraiso Encantado
          </h1>
          <p className="font-body text-lg md:text-xl mb-8" style={{ color: "rgba(245,240,232,0.85)" }}>
            Tu refugio de lujo en la selva potosina. 15 suites únicas, a 7 minutos del Jardín de Edward James.
          </p>
          <Link
            href="/booking"
            className="inline-block bg-brote hover:bg-ambar font-body font-semibold px-8 py-3 rounded transition-colors duration-200"
            style={{ color: "#f5f0e8" }}
          >
            Reservar Ahora
          </Link>
        </div>
      </section>

      {/* Info Rápida */}
      <section className="py-16 bg-parchment-soft">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-display text-jade mb-3">15</div>
              <h3 className="font-display text-2xl text-selva mb-2">Suites</h3>
              <p className="font-body text-gray-600">Cada una única, con carácter y lujo</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-display text-jade mb-3">7</div>
              <h3 className="font-display text-2xl text-selva mb-2">Minutos</h3>
              <p className="font-body text-gray-600">Del centro de Xilitla y Edward James</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-display text-jade mb-3">∞</div>
              <h3 className="font-display text-2xl text-selva mb-2">Naturaleza</h3>
              <p className="font-body text-gray-600">Selva, cascadas, ríos y paz total</p>
            </div>
          </div>
        </div>
      </section>

      {/* Habitaciones Preview */}
      <section className="py-16 md:py-24 bg-pergamino">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-display text-4xl md:text-5xl text-selva mb-4 text-center">
            Nuestras Suites
          </h2>
          <p className="font-body text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Quince espacios únicos, cada uno diseñado para ofrecer privacidad absoluta y lujo en la naturaleza
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {rooms.slice(0, 6).map((room) => (
              <div key={room.id} className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-52 overflow-hidden">
                  {roomImages[room.id] ? (
                    <Image
                      src={roomImages[room.id]}
                      alt={room.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-jade to-brote" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl text-selva mb-1">{room.name}</h3>
                  <p className="font-body text-xs tracking-widest uppercase text-ink-soft mb-3">{room.type}</p>
                  <p className="font-body text-ink-soft text-sm mb-4 line-clamp-2">
                    {room.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl text-jade">
                      ${room.price.toLocaleString("es-MX")}
                      <span className="font-body text-sm text-ink-soft">/noche</span>
                    </span>
                    <Link
                      href={`/habitaciones#${room.id}`}
                      className="text-brote hover:text-ambar font-body font-semibold transition-colors"
                    >
                      Ver →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/habitaciones"
              className="inline-block bg-brote hover:bg-ambar text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Ver Todas las Suites (15)
            </Link>
          </div>
        </div>
      </section>

      {/* Amenidades */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-display text-4xl md:text-5xl text-selva mb-4 text-center">
            Amenidades
          </h2>
          <p className="font-body text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Experiencias completas para tu estancia
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {amenities.map((amenity) => (
              <div key={amenity.id} className="p-6 border border-jade rounded-lg hover:bg-pergamino transition-colors">
                <h4 className="font-display text-xl text-jade mb-2">{amenity.name}</h4>
                <p className="font-body text-sm text-gray-600">{amenity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 bg-selva text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-6">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="font-body text-lg mb-8 text-pergamino">
            Reserva tu suite en Paraiso Encantado y vive la experiencia de lujo en la naturaleza
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
