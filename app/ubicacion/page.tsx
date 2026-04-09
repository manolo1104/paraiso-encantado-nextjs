import { hotelInfo } from '@/lib/data';

export const metadata = {
  title: 'Ubicación | Paraíso Encantado',
  description: 'Encuentra Paraíso Encantado en Xilitla, Huasteca Potosina. A 7 minutos del centro y cerca del Jardín Surrealista Edward James.',
};

export default function UbicacionPage() {
  return (
    <main className="w-full" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "50vh", padding: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 120% 100% at 50% 120%, #1e3012 0%, #0f0d0a 60%)" }}
        />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="font-body mb-5" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}>
            Encuéntranos
          </p>
          <h1 className="font-display mb-5" style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}>
            Ubicación
          </h1>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section style={{ background: "#0f0d0a", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Info */}
            <div>
              <p className="font-body mb-4" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}>
                Cómo llegar
              </p>
              <h2 className="font-display mb-10" style={{ color: "#f7f2e8", fontWeight: 300 }}>
                Encuéntranos
              </h2>

              <div className="space-y-8">
                {[
                  { icon: "📍", title: "Dirección", value: hotelInfo.location.address },
                  { icon: "📞", title: "Teléfono", value: hotelInfo.contact.phone, href: `tel:${hotelInfo.contact.phone}` },
                  { icon: "✉️", title: "Email", value: hotelInfo.contact.email, href: `mailto:${hotelInfo.contact.email}` },
                  { icon: "🗺️", title: "Coordenadas", value: `${hotelInfo.location.coordinates.lat}, ${hotelInfo.location.coordinates.lng}` },
                ].map((item) => (
                  <div key={item.title}>
                    <h3 className="font-display mb-2" style={{ fontSize: "18px", color: "#c8a96e", fontWeight: 300 }}>
                      {item.icon} {item.title}
                    </h3>
                    {item.href ? (
                      <a href={item.href} className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.7)", fontWeight: 300 }}>
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.55)", fontWeight: 300 }}>
                        {item.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "40px", background: "rgba(30,48,18,0.4)", border: "1px solid rgba(200,169,110,0.12)", borderRadius: "2px", padding: "24px 20px" }}>
                <h3 className="font-display mb-4" style={{ fontSize: "18px", color: "#f7f2e8", fontWeight: 300 }}>
                  ¿Cómo llegar?
                </h3>
                <div className="space-y-2">
                  {[
                    { from: "Desde Xilitla centro", time: "7 minutos en coche" },
                    { from: "Desde Aeropuerto San Luis Potosí", time: "2 horas" },
                    { from: "Desde Ciudad de México", time: "3.5 horas" },
                    { from: "Desde Tampico", time: "2 horas" },
                  ].map((route) => (
                    <p key={route.from} className="font-body" style={{ fontSize: "13px", color: "rgba(240,235,224,0.45)", fontWeight: 300 }}>
                      • <span style={{ color: "rgba(240,235,224,0.65)" }}>{route.from}:</span> {route.time}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Map + Landmarks */}
            <div>
              <div
                style={{
                  width: "100%",
                  height: "380px",
                  background: "linear-gradient(135deg, rgba(30,48,18,0.6) 0%, rgba(45,74,26,0.3) 100%)",
                  border: "1px solid rgba(200,169,110,0.12)",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "32px",
                }}
              >
                <div className="text-center" style={{ color: "rgba(240,235,224,0.4)" }}>
                  <p className="font-display mb-2" style={{ fontSize: "28px" }}>🗺️</p>
                  <p className="font-body" style={{ fontSize: "13px" }}>
                    Mapa interactivo<br />
                    <span style={{ fontSize: "11px" }}>Próximamente</span>
                  </p>
                </div>
              </div>

              <div style={{ background: "rgba(30,48,18,0.4)", border: "1px solid rgba(200,169,110,0.12)", borderRadius: "2px", padding: "24px 20px" }}>
                <h3 className="font-display mb-4" style={{ fontSize: "18px", color: "#f7f2e8", fontWeight: 300 }}>
                  Puntos de Referencia
                </h3>
                <div className="space-y-2">
                  {[
                    "A pasos del Jardín Surrealista Edward James",
                    "Cerca de las Pozas de Agua Fría",
                    "Próximo a Cascada del Salto",
                    "Centro de Xilitla a 5 km",
                  ].map((landmark) => (
                    <p key={landmark} className="font-body" style={{ fontSize: "13px", color: "rgba(240,235,224,0.5)", fontWeight: 300 }}>
                      ✓ {landmark}
                    </p>
                  ))}
                </div>
              </div>
            </div>
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
          <h2 className="font-display mb-8" style={{ color: "#f7f2e8", fontWeight: 300 }}>
            ¿Listo para <em style={{ color: "#c8a96e" }}>visitarnos?</em>
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
