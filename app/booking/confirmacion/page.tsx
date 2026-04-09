import Link from 'next/link';

export default function ConfirmacionPage() {
  return (
    <main className="w-full min-h-screen flex items-center justify-center" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Checkmark */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center justify-center" style={{ width: "80px", height: "80px", border: "2px solid rgba(200,169,110,0.4)", borderRadius: "2px" }}>
              <svg className="w-10 h-10" fill="none" stroke="#c8a96e" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <p className="font-body mb-4" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}>
            Confirmación
          </p>
          <h1 className="font-display mb-4" style={{ fontStyle: "italic", fontWeight: 300, color: "#f7f2e8" }}>
            ¡Reserva Confirmada!
          </h1>

          <p className="font-body mb-10 mx-auto" style={{ fontSize: "15px", color: "rgba(240,235,224,0.55)", fontWeight: 300, maxWidth: "480px" }}>
            Tu solicitud ha sido recibida. Recibirás un email de confirmación con todos los detalles
            de tu reserva en las próximas 24 horas.
          </p>

          <div style={{ background: "rgba(30,48,18,0.4)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: "2px", padding: "32px 28px", marginBottom: "32px" }}>
            <h3 className="font-display mb-5" style={{ fontSize: "22px", color: "#c8a96e", fontWeight: 300 }}>Próximos pasos</h3>
            <ul className="font-body text-left space-y-4 max-w-md mx-auto">
              {[
                "Revisa tu email para la confirmación y detalles de pago",
                "Realiza el pago para asegurar tu reserva",
                "Te enviaremos información de check-in una semana antes",
                "¡Disfruta tu experiencia en Paraíso Encantado!",
              ].map((step, i) => (
                <li key={i} className="flex items-start">
                  <span className="font-body mr-3" style={{ color: "#c8a96e", fontSize: "12px", fontWeight: 500, minWidth: "18px" }}>{i + 1}.</span>
                  <span style={{ fontSize: "14px", color: "rgba(240,235,224,0.6)", fontWeight: 300 }}>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.45)", fontWeight: 300 }}>
              ¿Preguntas? Contáctanos por WhatsApp:{' '}
              <a
                href="https://wa.me/5248910007679"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#c8a96e", borderBottom: "1px solid rgba(200,169,110,0.3)" }}
              >
                +52-489-100-7679
              </a>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/"
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
                Volver al Inicio
              </Link>
              <Link
                href="/habitaciones"
                className="font-body"
                style={{
                  background: "transparent",
                  color: "#c8a96e",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  padding: "14px 32px",
                  borderRadius: "2px",
                  border: "1px solid rgba(200,169,110,0.35)",
                  display: "inline-block",
                }}
              >
                Ver Otras Suites
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
