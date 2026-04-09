export const metadata = {
  title: 'Política de Cancelación | Paraíso Encantado',
  description: 'Consulta nuestra política de cancelación y reembolsos.',
};

export default function CancelacionPage() {
  return (
    <main className="w-full" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "35vh", padding: 0 }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 100% at 50% 120%, #1e3012 0%, #0f0d0a 60%)" }} />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="font-body mb-5" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}>Legal</p>
          <h1 className="font-display" style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}>Política de Cancelación</h1>
        </div>
      </section>

      <section style={{ background: "#0f0d0a", padding: "80px 0 96px" }}>
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="space-y-10">
            {[
              { title: "Cancelación con más de 7 días de anticipación", text: "Se reembolsa el 100% del monto pagado." },
              { title: "Cancelación entre 3 y 7 días antes", text: "Se reembolsa el 50% del monto pagado." },
              { title: "Cancelación con menos de 3 días", text: "No se realizan reembolsos por cancelaciones con menos de 72 horas de anticipación." },
              { title: "No-show", text: "En caso de no presentarse, no se realizará reembolso alguno." },
              { title: "Modificaciones", text: "Las modificaciones de fecha están sujetas a disponibilidad y deben solicitarse con al menos 48 horas de anticipación." },
              { title: "Fuerza mayor", text: "En casos de fuerza mayor comprobable (desastres naturales, emergencias médicas), se evaluará cada caso de forma individual." },
            ].map((item, i) => (
              <div key={i} style={{ paddingBottom: "32px", borderBottom: "1px solid rgba(200,169,110,0.08)" }}>
                <h2 className="font-display mb-3" style={{ fontSize: "20px", color: "#c8a96e", fontWeight: 300 }}>{item.title}</h2>
                <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.55)", fontWeight: 300, lineHeight: "1.8" }}>{item.text}</p>
              </div>
            ))}
          </div>
          <p className="font-body mt-12" style={{ fontSize: "12px", color: "rgba(240,235,224,0.3)", fontWeight: 300 }}>
            Para solicitar una cancelación, contacta a{' '}
            <a href="mailto:reservas@paraisoencantado.com" style={{ color: "#c8a96e" }}>reservas@paraisoencantado.com</a>{' '}
            o al{' '}
            <a href="tel:+524891007679" style={{ color: "#c8a96e" }}>+52 (489) 100-7679</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
