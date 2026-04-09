import Link from 'next/link';

export const metadata = {
  title: 'Blog | Paraíso Encantado – Xilitla',
  description: 'Historias, consejos y experiencias desde la Huasteca Potosina.',
};

export default function BlogPage() {
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
            Historias
          </p>
          <h1 className="font-display mb-5" style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}>
            Blog
          </h1>
          <p className="font-body mx-auto" style={{ color: "rgba(240,235,224,0.55)", maxWidth: "480px", fontWeight: 300 }}>
            Descubre la Huasteca a través de nuestras experiencias.
          </p>
        </div>
      </section>

      {/* ── COMING SOON ── */}
      <section style={{ background: "#0f0d0a", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div
            style={{
              maxWidth: "500px",
              margin: "0 auto",
              background: "rgba(30,48,18,0.3)",
              border: "1px solid rgba(200,169,110,0.12)",
              borderRadius: "2px",
              padding: "60px 40px",
            }}
          >
            <p className="font-display mb-4" style={{ fontSize: "48px", color: "rgba(200,169,110,0.3)" }}>✦</p>
            <h2 className="font-display mb-5" style={{ color: "#f7f2e8", fontWeight: 300 }}>
              Próximamente
            </h2>
            <p className="font-body mb-8" style={{ fontSize: "14px", color: "rgba(240,235,224,0.45)", fontWeight: 300, lineHeight: "1.8" }}>
              Estamos preparando historias, guías de viaje y consejos para que tu estancia
              en la Huasteca Potosina sea inolvidable.
            </p>
            <Link
              href="/"
              className="font-body"
              style={{
                background: "transparent",
                color: "#c8a96e",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "3px",
                textTransform: "uppercase",
                padding: "14px 36px",
                borderRadius: "2px",
                border: "1px solid rgba(200,169,110,0.35)",
                display: "inline-block",
              }}
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
