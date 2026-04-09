export const metadata = {
  title: 'Guía de la Huasteca Potosina | Paraíso Encantado',
  description: 'La guía definitiva de la Huasteca Potosina: atracciones, gastronomía, transporte y consejos para viajeros.',
};

export default function GuiaHuastecaPage() {
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
            Guía Definitiva 2026
          </p>
          <h1
            className="font-display mb-5"
            style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}
          >
            La Huasteca <span style={{ color: "#c8a96e" }}>Potosina</span>
          </h1>
          <p
            className="font-body mx-auto"
            style={{ color: "rgba(240,235,224,0.55)", maxWidth: "520px", fontWeight: 300, lineHeight: 1.85 }}
          >
            Todo lo que necesitas saber para tu aventura en la selva.
          </p>
        </div>
      </section>

      {/* ── ATRACCIONES ── */}
      <section style={{ background: "#0f0d0a", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px mb-16" style={{ background: "rgba(200,169,110,0.08)" }}>
            {[
              {
                icon: "🌳",
                title: "Jardín Surrealista Edward James",
                desc: "La joya de la Huasteca. Un jardín surrealista único en el mundo, diseñado por el poeta inglés Edward James. Camina entre construcciones imposibles, cascadas y la exuberante selva.",
                details: ["Ubicado a 5 min de Paraíso Encantado", "Horarios: 8:00 - 17:00", "Entrada: $150 MXN aprox", "Tours guiados disponibles"],
              },
              {
                icon: "💧",
                title: "Cascadas y Pozas",
                desc: "La región es famosa por sus cascadas y piscinas naturales. Desde Cascada de Agua Fría hasta las pozas cristalinas, la Huasteca es un paraíso acuático.",
                details: ["Tours acuáticos desde el hotel", "Rappelling disponible", "Fotografía natural", "Baño en pozas cristalinas"],
              },
              {
                icon: "🍲",
                title: "Gastronomía Huasteca",
                desc: "La Huasteca tiene una gastronomía única. Prueba los platillos típicos: tamales, mole, caldo de res, y pozole.",
                details: ["🌮 Tamales huastecos", "🍲 Caldo de camarón", "🐔 Mole negro", "🥛 Tejate (bebida tradicional)"],
              },
              {
                icon: "🚗",
                title: "Transporte y Movilidad",
                desc: "La mejor forma de explorar es con vehículo propio. Desde Paraíso Encantado puedes acceder a todos los puntos principales.",
                details: ["Renta de autos en Xilitla", "Tours con chofer disponibles", "Carreteras en buen estado", "Gasolina: +/- 15 min a pie"],
              },
            ].map((item) => (
              <div key={item.title} style={{ background: "#0f0d0a", padding: "40px 36px" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{item.icon}</div>
                <h2
                  className="font-display mb-4"
                  style={{ fontSize: "24px", color: "#f7f2e8", fontWeight: 300 }}
                >
                  {item.title}
                </h2>
                <p
                  className="font-body mb-5"
                  style={{ fontSize: "14px", color: "rgba(240,235,224,0.5)", fontWeight: 300, lineHeight: 1.85 }}
                >
                  {item.desc}
                </p>
                <div className="space-y-2">
                  {item.details.map((d) => (
                    <p
                      key={d}
                      className="font-body"
                      style={{ fontSize: "13px", color: "rgba(240,235,224,0.4)", fontWeight: 300 }}
                    >
                      ✓ {d}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONSEJOS ── */}
      <section
        style={{
          background: "#152009",
          borderTop: "1px solid rgba(200,169,110,0.12)",
          padding: "96px 0",
        }}
      >
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="mb-14">
            <p
              className="font-body mb-4"
              style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}
            >
              Para viajeros
            </p>
            <h2 className="font-display" style={{ color: "#f7f2e8", fontWeight: 300 }}>
              Consejos <em style={{ color: "#c8a96e" }}>útiles</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "rgba(200,169,110,0.08)" }}>
            {[
              { title: "Mejor época", desc: "Octubre a mayo. Menos lluvia y temperaturas agradables." },
              { title: "Qué llevar", desc: "Ropa cómoda, zapatos para senderismo, bloqueador, repelente y cámara." },
              { title: "Presupuesto", desc: "Los precios en la Huasteca son muy accesibles. Comida típica desde $50 MXN." },
              { title: "Duración", desc: "Mínimo 3 días. Ideal 4-5 días para disfrutar completamente." },
            ].map((tip) => (
              <div key={tip.title} style={{ background: "#152009", padding: "32px 28px" }}>
                <h3
                  className="font-display mb-3"
                  style={{ fontSize: "20px", color: "#c8a96e", fontWeight: 300 }}
                >
                  {tip.title}
                </h3>
                <p
                  className="font-body"
                  style={{ fontSize: "14px", color: "rgba(240,235,224,0.5)", fontWeight: 300, lineHeight: 1.75 }}
                >
                  {tip.desc}
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
          padding: "96px 0",
          textAlign: "center",
        }}
      >
        <div className="container mx-auto px-6">
          <p
            className="font-body mb-6"
            style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            Tu aventura comienza aquí
          </p>
          <h2
            className="font-display mb-8"
            style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}
          >
            Empieza tu aventura <em style={{ color: "#c8a96e" }}>en la Huasteca</em>
          </h2>
          <a
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
          </a>
        </div>
      </section>
    </main>
  );
}
