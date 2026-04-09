export const metadata = {
  title: 'Política de Privacidad | Paraíso Encantado',
  description: 'Conoce cómo protegemos tus datos personales.',
};

export default function PrivacidadPage() {
  return (
    <main className="w-full" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "35vh", padding: 0 }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 100% at 50% 120%, #1e3012 0%, #0f0d0a 60%)" }} />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="font-body mb-5" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}>Legal</p>
          <h1 className="font-display" style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}>Política de Privacidad</h1>
        </div>
      </section>

      <section style={{ background: "#0f0d0a", padding: "80px 0 96px" }}>
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="space-y-10">
            {[
              { title: "Responsable del tratamiento", text: "Paraíso Encantado, ubicado en Xilitla, San Luis Potosí, México, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares." },
              { title: "Datos que recopilamos", text: "Recopilamos nombre, correo electrónico, teléfono y datos de reservación proporcionados voluntariamente al hacer una reserva o contactarnos. No almacenamos datos de tarjetas de crédito en nuestros servidores." },
              { title: "Finalidad del tratamiento", text: "Tus datos se utilizan para: procesar reservaciones, enviar confirmaciones y comunicaciones relacionadas con tu estancia, responder consultas, y mejorar nuestros servicios." },
              { title: "Compartición de datos", text: "No compartimos tus datos personales con terceros, excepto cuando sea necesario para procesar tu reservación (procesadores de pago) o cuando la ley lo requiera." },
              { title: "Derechos ARCO", text: "Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales. Para ejercer estos derechos, envía un correo a reservas@paraisoencantado.com." },
              { title: "Seguridad", text: "Implementamos medidas de seguridad técnicas y administrativas para proteger tus datos personales contra acceso no autorizado, pérdida o alteración." },
              { title: "Cookies", text: "Nuestro sitio web utiliza cookies para mejorar la experiencia del usuario. Puedes desactivar las cookies en la configuración de tu navegador." },
            ].map((item, i) => (
              <div key={i} style={{ paddingBottom: "32px", borderBottom: "1px solid rgba(200,169,110,0.08)" }}>
                <h2 className="font-display mb-3" style={{ fontSize: "20px", color: "#c8a96e", fontWeight: 300 }}>{item.title}</h2>
                <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.55)", fontWeight: 300, lineHeight: "1.8" }}>{item.text}</p>
              </div>
            ))}
          </div>
          <p className="font-body mt-12" style={{ fontSize: "12px", color: "rgba(240,235,224,0.3)", fontWeight: 300 }}>
            Última actualización: enero 2025. Para consultas sobre privacidad, contacta a{' '}
            <a href="mailto:reservas@paraisoencantado.com" style={{ color: "#c8a96e" }}>reservas@paraisoencantado.com</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
