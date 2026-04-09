import Link from 'next/link';
import { restaurantInfo } from '@/lib/data';

export const metadata = {
  title: 'El Papán Huasteco | Restaurante | Paraíso Encantado',
  description: 'Disfruta de auténtica gastronomía huasteca en El Papán Huasteco. Platillos caseros, tortillas hechas a mano y sazón tradicional.',
};

export default function RestaurantePage() {
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
            Gastronomía
          </p>
          <h1
            className="font-display mb-5"
            style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}
          >
            El Papán <span style={{ color: "#c8a96e" }}>Huasteco</span>
          </h1>
          <p
            className="font-body mx-auto"
            style={{ color: "rgba(240,235,224,0.55)", maxWidth: "520px", fontWeight: 300, lineHeight: 1.85 }}
          >
            Auténtica gastronomía de la Huasteca Potosina.
          </p>
        </div>
      </section>

      {/* ── INFO ── */}
      <section style={{ background: "#0f0d0a", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Description */}
            <div>
              <p
                className="font-body mb-4"
                style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}
              >
                Experiencia culinaria
              </p>
              <h2 className="font-display mb-6" style={{ color: "#f7f2e8", fontWeight: 300 }}>
                Sabores de la <em style={{ color: "#c8a96e" }}>Huasteca</em>
              </h2>
              <p
                className="font-body mb-6"
                style={{ fontSize: "15px", color: "rgba(240,235,224,0.55)", fontWeight: 300, lineHeight: 1.85 }}
              >
                {restaurantInfo.description}
              </p>
              <p
                className="font-body mb-8"
                style={{ fontSize: "15px", color: "rgba(240,235,224,0.55)", fontWeight: 300, lineHeight: 1.85 }}
              >
                Nuestro equipo culinario prepara cada platillo con ingredientes frescos y técnicas tradicionales. Desde tamales hasta mole, cada bocado es una explosión de sabor.
              </p>

              <div className="space-y-6">
                {[
                  { icon: "📍", title: "Ubicación", desc: "Terraza al aire libre rodeada de naturaleza" },
                  { icon: "⏰", title: "Horarios", desc: "Desayuno 7:00-10:00 · Comida 13:00-16:00 · Cena 19:00-22:00" },
                  { icon: "👥", title: "Reservaciones", desc: "Contáctanos para reservar una mesa especial" },
                ].map((item) => (
                  <div key={item.title}>
                    <h3
                      className="font-display mb-2"
                      style={{ fontSize: "18px", color: "#c8a96e", fontWeight: 300 }}
                    >
                      {item.icon} {item.title}
                    </h3>
                    <p
                      className="font-body"
                      style={{ fontSize: "14px", color: "rgba(240,235,224,0.5)", fontWeight: 300 }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <div
                className="mb-8"
                style={{
                  height: "320px",
                  background: "linear-gradient(135deg, #1e3012 0%, #2d4a1a 100%)",
                  borderRadius: "2px",
                  border: "1px solid rgba(200,169,110,0.12)",
                }}
              />
              <div
                style={{
                  background: "rgba(30,48,18,0.4)",
                  border: "1px solid rgba(200,169,110,0.15)",
                  padding: "36px 32px",
                  borderRadius: "2px",
                }}
              >
                <h3
                  className="font-display mb-5"
                  style={{ fontSize: "22px", color: "#f7f2e8", fontWeight: 300 }}
                >
                  Especialidades
                </h3>
                <div className="space-y-3">
                  {[
                    "🌮 Tamales huastecos",
                    "🍲 Mole negro tradicional",
                    "🐔 Pollo en pipián",
                    "🥘 Caldo de res",
                    "🌶️ Salsa casera",
                    "🥛 Bebidas tradicionales",
                    "🍰 Postres caseros",
                  ].map((item) => (
                    <p
                      key={item}
                      className="font-body"
                      style={{ fontSize: "14px", color: "rgba(240,235,224,0.6)", fontWeight: 300 }}
                    >
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MENU CTA ── */}
      <section
        style={{
          background: "#1e3012",
          borderTop: "1px solid rgba(200,169,110,0.12)",
          borderBottom: "1px solid rgba(200,169,110,0.12)",
          padding: "64px 0",
          textAlign: "center",
        }}
      >
        <div className="container mx-auto px-6">
          <h2 className="font-display mb-4" style={{ color: "#f7f2e8", fontWeight: 300 }}>
            Menú Completo
          </h2>
          <p
            className="font-body mb-8"
            style={{ color: "rgba(240,235,224,0.5)", fontWeight: 300 }}
          >
            Descarga nuestro menú PDF para conocer todos nuestros platillos y bebidas
          </p>
          <a
            href="/menu-papan-huasteco.pdf"
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
            📥 Descargar Menú
          </a>
        </div>
      </section>

      {/* ── CHEF CTA ── */}
      <section
        style={{
          background: "radial-gradient(ellipse 100% 80% at 50% 100%, #1e3012 0%, #0f0d0a 65%)",
          padding: "96px 0",
          textAlign: "center",
        }}
      >
        <div className="container mx-auto px-6 max-w-2xl">
          <p
            className="font-body mb-4"
            style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            Tradición culinaria
          </p>
          <h2
            className="font-display mb-6"
            style={{ color: "#f7f2e8", fontWeight: 300 }}
          >
            Cocinado con <em style={{ color: "#c8a96e" }}>pasión</em>
          </h2>
          <p
            className="font-body mb-10"
            style={{ color: "rgba(240,235,224,0.55)", fontWeight: 300, lineHeight: 1.85 }}
          >
            Cada platillo en El Papán Huasteco es preparado con amor y respeto por las tradiciones culinarias de la región. Nuestros chefs combinan ingredientes locales con técnicas ancestrales para crear una experiencia gastronómica inolvidable.
          </p>
          <Link
            href="/contacto"
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
            Hacer Reservación
          </Link>
        </div>
      </section>
    </main>
  );
}
