import { amenities, hotelInfo } from '@/lib/data';

export const metadata = {
  title: 'Amenidades | Paraíso Encantado',
  description: 'Descubre todas las amenidades y servicios de lujo en Paraíso Encantado: piscina spa, restaurante, WiFi, tours y más.',
};

export default function AmenidadesPage() {
  return (
    <main className="w-full" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "50vh", padding: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 120% 100% at 50% 120%, #1e3012 0%, #0f0d0a 60%)",
          }}
        />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p
            className="font-body mb-5"
            style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            Experiencias
          </p>
          <h1
            className="font-display mb-5"
            style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}
          >
            Amenidades
          </h1>
          <p
            className="font-body mx-auto"
            style={{ color: "rgba(240,235,224,0.55)", maxWidth: "520px", fontWeight: 300, lineHeight: 1.85 }}
          >
            Lujo y confort en cada detalle de tu experiencia.
          </p>
        </div>
      </section>

      {/* ── AMENIDADES GRID ── */}
      <section style={{ background: "#152009", borderTop: "1px solid rgba(200,169,110,0.12)", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px mb-16"
            style={{ background: "rgba(200,169,110,0.1)" }}
          >
            {amenities.map((amenity) => (
              <div
                key={amenity.id}
                style={{ background: "#152009", padding: "32px 28px", transition: "border-color 0.3s" }}
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

      {/* ── DETALLES ── */}
      <section style={{ background: "#0f0d0a", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-14">
            <p
              className="font-body mb-4"
              style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}
            >
              Más sobre nuestros servicios
            </p>
            <h2 className="font-display" style={{ color: "#f7f2e8", fontWeight: 300 }}>
              Experiencias <em style={{ color: "#c8a96e" }}>únicas</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "rgba(200,169,110,0.08)" }}>
            {[
              {
                icon: "🍽️",
                title: "Restaurante El Papán Huasteco",
                desc: "Disfruta de la auténtica gastronomía huasteca en nuestro restaurante al aire libre. Platillos caseros con sazón tradicional, tortillas hechas a mano en comal.",
                detail: "Desayuno 7:00-10:00 · Comida 13:00-16:00 · Cena 19:00-22:00",
              },
              {
                icon: "🥾",
                title: "Tours y Actividades",
                desc: "Explora la Huasteca Potosina con nuestros tours especializados. Desde caminatas por la selva hasta visitas al Jardín Surrealista de Edward James.",
                detail: "Consulta con nuestro equipo para personalizar tu experiencia.",
              },
              {
                icon: "💆",
                title: "Spa y Wellness",
                desc: "Relájate en nuestra piscina spa con vistas a la selva. Masajes y tratamientos naturales disponibles bajo demanda.",
                detail: "Reserva tu sesión de bienestar.",
              },
              {
                icon: "📶",
                title: "Conectividad",
                desc: "WiFi de alta velocidad en todas las áreas. Espacio de trabajo disponible para nómadas digitales.",
                detail: "Conexión confiable para tu productividad.",
              },
            ].map((item) => (
              <div key={item.title} style={{ background: "#0f0d0a", padding: "40px 36px" }}>
                <div style={{ fontSize: "28px", marginBottom: "16px" }}>{item.icon}</div>
                <h3
                  className="font-display mb-3"
                  style={{ fontSize: "22px", color: "#f7f2e8", fontWeight: 300 }}
                >
                  {item.title}
                </h3>
                <p
                  className="font-body mb-4"
                  style={{ fontSize: "14px", color: "rgba(240,235,224,0.5)", fontWeight: 300, lineHeight: 1.85 }}
                >
                  {item.desc}
                </p>
                <p
                  className="font-body"
                  style={{ fontSize: "12px", color: "rgba(200,169,110,0.6)", fontWeight: 400 }}
                >
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background: "radial-gradient(ellipse 100% 80% at 50% 100%, #1e3012 0%, #0f0d0a 65%)",
          borderTop: "1px solid rgba(200,169,110,0.12)",
          padding: "96px 0",
          textAlign: "center",
        }}
      >
        <div className="container mx-auto px-6">
          <p
            className="font-body mb-6"
            style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            ¿Preguntas sobre nuestras amenidades?
          </p>
          <h2
            className="font-display mb-8"
            style={{ color: "#f7f2e8", fontWeight: 300 }}
          >
            Contáctanos
          </h2>
          <a
            href={`tel:${hotelInfo.contact.phone}`}
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
            Llamar Ahora
          </a>
        </div>
      </section>
    </main>
  );
}
