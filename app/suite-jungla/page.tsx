import Image from 'next/image';
import Link from 'next/link';

const CDN = 'https://booking-paraisoencantado.up.railway.app/images';

export const metadata = {
  title: 'Suite Jungla | Paraíso Encantado – Xilitla',
  description: 'Descubre la Suite Jungla, nuestra habitación premium con jacuzzi privado, vista panorámica a la selva y terraza amplia.',
};

const features = [
  'Cama King-Size',
  'Jacuzzi Privado',
  'Terraza Panorámica',
  'Vista a la Selva',
  'Baño de Lujo',
  'Aire Acondicionado',
  'WiFi de Alta Velocidad',
  'Amenidades Premium',
];

const gallery = [
  { src: `${CDN}/JUNGLA/jungla-1.jpg`, alt: 'Suite Jungla — Vista principal' },
  { src: `${CDN}/JUNGLA/jungla-2.jpg`, alt: 'Suite Jungla — Jacuzzi privado' },
  { src: `${CDN}/JUNGLA/jungla-3.jpg`, alt: 'Suite Jungla — Terraza con vista' },
  { src: `${CDN}/JUNGLA/jungla-4.jpg`, alt: 'Suite Jungla — Baño de lujo' },
];

export default function SuiteJunglaPage() {
  return (
    <main className="w-full" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "65vh" }}>
        <Image
          src={`${CDN}/JUNGLA/jungla-1.jpg`}
          alt="Suite Jungla — Paraíso Encantado"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,13,10,0.3) 0%, rgba(15,13,10,0.85) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10">
          <p className="font-body mb-4" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}>
            Suite Premium
          </p>
          <h1 className="font-display mb-3" style={{ fontSize: "clamp(36px, 5vw, 56px)", color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}>
            Suite Jungla
          </h1>
          <p className="font-body" style={{ fontSize: "15px", color: "rgba(240,235,224,0.6)", fontWeight: 300, maxWidth: "520px" }}>
            Nuestra suite insignia con jacuzzi privado y vistas panorámicas a la selva huasteca.
          </p>
        </div>
      </section>

      {/* ── DETAILS ── */}
      <section style={{ background: "#0f0d0a", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Info */}
            <div>
              <p className="font-body mb-4" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}>
                Descripción
              </p>
              <h2 className="font-display mb-8" style={{ color: "#f7f2e8", fontWeight: 300 }}>
                Tu <em style={{ color: "#c8a96e" }}>refugio</em> en la selva
              </h2>
              <p className="font-body mb-6" style={{ fontSize: "15px", color: "rgba(240,235,224,0.55)", fontWeight: 300, lineHeight: "1.8" }}>
                La Suite Jungla es nuestra habitación más exclusiva, diseñada para quienes buscan una experiencia de lujo
                inmersa en la naturaleza. Con vistas panorámicas a la selva huasteca, un jacuzzi privado en la terraza
                y acabados de primera calidad, esta suite redefine el concepto de hospedaje boutique.
              </p>
              <p className="font-body mb-8" style={{ fontSize: "15px", color: "rgba(240,235,224,0.45)", fontWeight: 300, lineHeight: "1.8" }}>
                Cada detalle ha sido pensado para crear un ambiente de tranquilidad y sofisticación,
                desde la iluminación tenue hasta los materiales naturales que conectan el interior con el exterior.
              </p>

              {/* Price Card */}
              <div style={{ background: "rgba(30,48,18,0.4)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "2px", padding: "28px 24px" }}>
                <p className="font-body mb-2" style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}>
                  Desde
                </p>
                <p className="font-display mb-3" style={{ fontSize: "36px", color: "#c8a96e", fontWeight: 300 }}>
                  $3,200 <span className="font-body" style={{ fontSize: "13px", color: "rgba(240,235,224,0.4)" }}>MXN / noche</span>
                </p>
                <Link
                  href="/booking"
                  className="font-body block text-center"
                  style={{
                    background: "#c8a96e",
                    color: "#152009",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    padding: "14px 24px",
                    borderRadius: "2px",
                    display: "block",
                  }}
                >
                  Reservar Suite Jungla
                </Link>
              </div>
            </div>

            {/* Features */}
            <div>
              <p className="font-body mb-4" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}>
                Amenidades
              </p>
              <h2 className="font-display mb-8" style={{ color: "#f7f2e8", fontWeight: 300 }}>
                Incluye
              </h2>
              <div className="grid grid-cols-2 gap-px" style={{ background: "rgba(200,169,110,0.08)" }}>
                {features.map((feature) => (
                  <div key={feature} style={{ background: "#0f0d0a", padding: "20px 16px" }}>
                    <p className="font-body" style={{ fontSize: "13px", color: "rgba(240,235,224,0.6)", fontWeight: 300 }}>
                      <span style={{ color: "#c8a96e", marginRight: "8px" }}>✓</span>
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section style={{ background: "#152009", borderTop: "1px solid rgba(200,169,110,0.12)", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6">
          <p className="font-body mb-4" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}>
            Galería
          </p>
          <h2 className="font-display mb-14" style={{ color: "#f7f2e8", fontWeight: 300 }}>
            Explora la <em style={{ color: "#c8a96e" }}>suite</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "rgba(200,169,110,0.08)" }}>
            {gallery.map((img) => (
              <div key={img.src} className="relative overflow-hidden" style={{ height: "360px" }}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,13,10,0.5) 0%, transparent 50%)" }} />
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
          <p className="font-body mb-5" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}>
            Reserva Directa
          </p>
          <h2 className="font-display mb-6" style={{ color: "#f7f2e8", fontWeight: 300 }}>
            Vive la experiencia <em style={{ color: "#c8a96e" }}>Jungla</em>
          </h2>
          <p className="font-body mx-auto mb-10" style={{ color: "rgba(240,235,224,0.5)", fontWeight: 300, maxWidth: "480px", fontSize: "15px" }}>
            Reserva directamente con nosotros para obtener el mejor precio garantizado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            <a
              href="https://wa.me/5248910007679"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body"
              style={{
                background: "transparent",
                color: "#c8a96e",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "3px",
                textTransform: "uppercase",
                padding: "16px 40px",
                borderRadius: "2px",
                border: "1px solid rgba(200,169,110,0.35)",
                display: "inline-block",
              }}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
