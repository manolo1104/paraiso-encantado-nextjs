export const metadata = {
  title: 'Términos y Condiciones | Paraíso Encantado',
  description: 'Lee nuestros términos y condiciones de servicio.',
};

export default function TerminosPage() {
  return (
    <main className="w-full" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "35vh", padding: 0 }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 100% at 50% 120%, #1e3012 0%, #0f0d0a 60%)" }} />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="font-body mb-5" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}>Legal</p>
          <h1 className="font-display" style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}>Términos y Condiciones</h1>
        </div>
      </section>

      <section style={{ background: "#0f0d0a", padding: "80px 0 96px" }}>
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="space-y-10">
            {[
              { title: "1. Reservaciones", text: "Todas las reservaciones están sujetas a disponibilidad. Al realizar una reserva, el huésped acepta los términos aquí descritos. Las tarifas publicadas son por noche y por habitación, e incluyen impuestos aplicables salvo que se indique lo contrario." },
              { title: "2. Check-in y Check-out", text: "El horario de check-in es a partir de las 15:00 hrs y el check-out antes de las 12:00 hrs. Se puede solicitar early check-in o late check-out sujeto a disponibilidad y posible cargo adicional." },
              { title: "3. Ocupación", text: "Cada suite tiene una capacidad máxima indicada en la descripción. Se prohíbe exceder la capacidad máxima. Los menores de 12 años no generan cargo adicional cuando comparten cama con los padres." },
              { title: "4. Políticas del Hotel", text: "Paraíso Encantado es un hotel libre de humo. Se prohíbe fumar en todas las áreas interiores. Se permiten mascotas pequeñas previa autorización y con cargo adicional. El hotel no se hace responsable por objetos de valor no depositados en recepción." },
              { title: "5. Responsabilidad", text: "El hotel se reserva el derecho de admisión y permanencia. Los huéspedes son responsables de los daños causados a las instalaciones durante su estancia. El hotel no se responsabiliza por cancelaciones debidas a causas de fuerza mayor." },
              { title: "6. Privacidad", text: "Los datos personales proporcionados serán tratados conforme a nuestra Política de Privacidad y la legislación mexicana aplicable en materia de protección de datos personales." },
            ].map((item, i) => (
              <div key={i} style={{ paddingBottom: "32px", borderBottom: "1px solid rgba(200,169,110,0.08)" }}>
                <h2 className="font-display mb-3" style={{ fontSize: "20px", color: "#c8a96e", fontWeight: 300 }}>{item.title}</h2>
                <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.55)", fontWeight: 300, lineHeight: "1.8" }}>{item.text}</p>
              </div>
            ))}
          </div>
          <p className="font-body mt-12" style={{ fontSize: "12px", color: "rgba(240,235,224,0.3)", fontWeight: 300 }}>
            Última actualización: enero 2025. Para consultas, contacta a{' '}
            <a href="mailto:reservas@paraisoencantado.com" style={{ color: "#c8a96e" }}>reservas@paraisoencantado.com</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
