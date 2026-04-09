

export const metadata = {
  title: 'Política de Privacidad | Paraiso Encantado',
  description: 'Nuestra política de privacidad y protección de datos.',
};

export default function PrivacidadPage() {
  return (
    <main className="w-full">
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl text-selva mb-12">
            Política de Privacidad
          </h1>

          <div className="font-body text-gray-700 space-y-6">
            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                1. Información que Recopilamos
              </h2>
              <p>
                Recopilamos información personal como nombre, email, teléfono y datos de reservación para proporcionar nuestros servicios y mejorar tu experiencia.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                2. Cómo Usamos tu Información
              </h2>
              <p>
                Utilizamos tu información para procesar reservaciones, contactarte sobre tu estancia, y mejorar nuestros servicios. Nunca compartiremos tu información con terceros sin consentimiento.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                3. Cookies
              </h2>
              <p>
                Nuestro sitio utiliza cookies para mejorar la experiencia del usuario. Puedes configurar tu navegador para rechazar cookies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                4. Seguridad de Datos
              </h2>
              <p>
                Utilizamos medidas de seguridad estándar de la industria para proteger tu información personal contra acceso no autorizado.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                5. Tus Derechos
              </h2>
              <p>
                Tienes el derecho de acceder, rectificar o eliminar tus datos personales. Contáctanos para ejercer estos derechos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                6. Contacto
              </h2>
              <p>
                Para preguntas sobre privacidad, contáctanos a reservas@paraisoencantado.com
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
