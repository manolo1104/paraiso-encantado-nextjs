import Link from "next/link";
import Image from "next/image";
import { rooms, amenities, hotelInfo } from "@/lib/data";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export default function Home() {
  return (
    <main className="w-full" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      <WhatsAppFloat />

      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "92vh", padding: 0 }}
      >
        {/* Foto de fondo */}
        <Image
          src={hotelInfo.heroImage}
          alt="Paraíso Encantado — Xilitla, Huasteca Potosina"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        {/* Overlay oscuro — branding */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,13,10,0.35) 0%, rgba(21,32,9,0.55) 55%, rgba(15,13,10,0.80) 100%)",
          }}
        />

        {/* Contenido hero */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p
            className="font-body mb-5"
            style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            Xilitla · Huasteca Potosina
          </p>
          <h1
            className="font-display mb-5"
            style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}
          >
            Paraíso<br />
            <span style={{ color: "#c8a96e" }}>Encantado</span>
          </h1>
          <p
            className="font-body mb-10 mx-auto"
            style={{ color: "rgba(240,235,224,0.70)", maxWidth: "560px", fontWeight: 300, fontSize: "1.0625rem", lineHeight: 1.85 }}
          >
            Donde la selva te recibe. 15 suites únicas a pasos del Jardín Surrealista de Edward James.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/booking"
              className="font-body"
              style={{
                background: "#c8a96e",
                color: "#152009",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "3px",
                textTransform: "uppercase",
                padding: "14px 32px",
                borderRadius: "2px",
                display: "inline-block",
              }}
            >
              Reservar Ahora
            </Link>
            <Link
              href="/habitaciones"
              className="font-body"
              style={{
                border: "1px solid rgba(200,169,110,0.45)",
                color: "rgba(240,235,224,0.75)",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "3px",
                textTransform: "uppercase",
                padding: "14px 32px",
                borderRadius: "2px",
                display: "inline-block",
              }}
            >
              Ver Suites
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: "rgba(200,169,110,0.4)" }}
        >
          <span style={{ fontSize: "9px", letterSpacing: "4px", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: "1px", height: "40px", background: "linear-gradient(#c8a96e, transparent)" }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        style={{
          background: "#1e3012",
          borderTop: "1px solid rgba(200,169,110,0.12)",
          borderBottom: "1px solid rgba(200,169,110,0.12)",
          padding: "48px 0",
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 gap-0">
            {[
              { num: "15", label: "Suites", sub: "Cada una única" },
              { num: "7", label: "Minutos", sub: "Del Jardín de Edward James" },
              { num: "4.8", label: "Estrellas", sub: "514 reseñas verificadas" },
            ].map(({ num, label, sub }) => (
              <div
                key={label}
                className="text-center px-4"
                style={{ borderRight: "1px solid rgba(200,169,110,0.12)" }}
              >
                <div
                  className="font-display"
                  style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontStyle: "italic", fontWeight: 300, color: "#c8a96e" }}
                >
                  {num}
                </div>
                <div className="font-display" style={{ fontSize: "18px", color: "#f7f2e8", fontWeight: 300, marginTop: "4px" }}>
                  {label}
                </div>
                <div className="font-body" style={{ fontSize: "12px", color: "rgba(240,235,224,0.45)", marginTop: "4px", fontWeight: 300, letterSpacing: "0.5px" }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUITES ── */}
      <section style={{ background: "#0f0d0a", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6">
          {/* Header sección */}
          <div className="mb-16">
            <p
              className="font-body mb-4"
              style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}
            >
              Alojamiento
            </p>
            <h2 className="font-display" style={{ color: "#f7f2e8", fontWeight: 300 }}>
              Nuestras<br />
              <em style={{ color: "#c8a96e" }}>Suites</em>
            </h2>
            <p
              className="font-body mt-4"
              style={{ color: "rgba(240,235,224,0.5)", maxWidth: "520px", fontWeight: 300 }}
            >
              Quince espacios únicos, cada uno diseñado para ofrecer privacidad absoluta y lujo en la naturaleza.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "rgba(200,169,110,0.1)" }}>
            {rooms.slice(0, 6).map((room) => (
              <div
                key={room.id}
                className="group"
                style={{ background: "#0f0d0a" }}
              >
                {/* Imagen */}
                <div className="relative overflow-hidden" style={{ height: "240px" }}>
                  <Image
                    src={room.cover}
                    alt={room.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                  {/* Overlay sutil */}
                  <div className="absolute inset-0" style={{ background: "rgba(15,13,10,0.25)" }} />
                </div>

                {/* Info */}
                <div style={{ padding: "24px 28px 28px", borderTop: "1px solid rgba(200,169,110,0.1)" }}>
                  <p
                    className="font-body mb-2"
                    style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}
                  >
                    {room.type}
                  </p>
                  <h3
                    className="font-display mb-3"
                    style={{ fontSize: "22px", color: "#f7f2e8", fontWeight: 300 }}
                  >
                    {room.name}
                  </h3>
                  <p
                    className="font-body mb-5"
                    style={{ fontSize: "13px", color: "rgba(240,235,224,0.5)", fontWeight: 300, lineHeight: 1.75 }}
                  >
                    {room.description}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <span
                        className="font-body"
                        style={{ fontSize: "10px", color: "rgba(240,235,224,0.4)", letterSpacing: "1px", display: "block" }}
                      >
                        Desde
                      </span>
                      <span
                        className="font-display"
                        style={{ fontSize: "24px", color: "#c8a96e", fontWeight: 300 }}
                      >
                        ${room.price.toLocaleString("es-MX")}
                        <span
                          className="font-body"
                          style={{ fontSize: "11px", color: "rgba(240,235,224,0.4)", fontWeight: 300 }}
                        >
                          {" "}MXN/noche
                        </span>
                      </span>
                    </div>
                    <Link
                      href={`/habitaciones#${room.id}`}
                      className="font-body"
                      style={{
                        fontSize: "9px",
                        fontWeight: 500,
                        letterSpacing: "2.5px",
                        textTransform: "uppercase",
                        color: "#c8a96e",
                        borderBottom: "1px solid rgba(200,169,110,0.4)",
                        paddingBottom: "2px",
                      }}
                    >
                      Ver Suite →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA ver todas */}
          <div className="text-center mt-12">
            <Link
              href="/habitaciones"
              className="font-body"
              style={{
                border: "1px solid rgba(200,169,110,0.35)",
                color: "rgba(240,235,224,0.7)",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "3px",
                textTransform: "uppercase",
                padding: "14px 36px",
                borderRadius: "2px",
                display: "inline-block",
              }}
            >
              Ver Todas las Suites (15)
            </Link>
          </div>
        </div>
      </section>

      {/* ── AMENIDADES ── */}
      <section
        style={{
          background: "#1e3012",
          borderTop: "1px solid rgba(200,169,110,0.12)",
          padding: "96px 0",
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-14">
            <p
              className="font-body mb-4"
              style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}
            >
              Experiencias
            </p>
            <h2 className="font-display" style={{ color: "#f7f2e8", fontWeight: 300 }}>
              Amenidades
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "rgba(200,169,110,0.1)" }}>
            {amenities.map((amenity) => (
              <div
                key={amenity.id}
                style={{ background: "#1e3012", padding: "28px 24px" }}
              >
                <h4
                  className="font-display mb-3"
                  style={{ fontSize: "20px", color: "#f7f2e8", fontWeight: 300 }}
                >
                  {amenity.name}
                </h4>
                <p
                  className="font-body"
                  style={{ fontSize: "13px", color: "rgba(240,235,224,0.5)", fontWeight: 300, lineHeight: 1.75 }}
                >
                  {amenity.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section
        style={{
          background: "radial-gradient(ellipse 100% 80% at 50% 100%, #1e3012 0%, #0f0d0a 65%)",
          padding: "120px 0",
          textAlign: "center",
        }}
      >
        <div className="container mx-auto px-6">
          <p
            className="font-body mb-6"
            style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            Reserva Directa · Mejor Precio Garantizado
          </p>
          <h2
            className="font-display mb-6"
            style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}
          >
            La Huasteca<br />
            <em style={{ color: "#c8a96e" }}>te espera.</em>
          </h2>
          <p
            className="font-body mb-10 mx-auto"
            style={{ color: "rgba(240,235,224,0.55)", maxWidth: "480px", fontWeight: 300 }}
          >
            Reserva directamente y obtén el mejor precio disponible. Sin intermediarios, sin cargos extra.
          </p>
          <Link
            href="/booking"
            className="font-body"
            style={{
              background: "#c8a96e",
              color: "#152009",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "3px",
              textTransform: "uppercase",
              padding: "16px 40px",
              borderRadius: "2px",
              display: "inline-block",
            }}
          >
            Reservar Ahora
          </Link>
        </div>
      </section>
    </main>
  );
}
