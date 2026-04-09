

export const metadata = {
  title: 'Política de Cancelación | Paraiso Encantado',
  description: 'Conoce nuestra política de cancelación y cambios de fechas.',
};

export default function CancelacionPage() {
  return (
    <main className="w-full">
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl text-selva mb-12">
            Política de Cancelación
          </h1>

          <div className="font-body text-gray-700 space-y-6">
            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                Cancelaciones Gratuitas
              </h2>
              <p>
                Puedes cancelar tu reservación de forma gratuita hasta 30 días antes de tu llegada. Se reembolsará el 100% del dinero pagado.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                Cancelación 15-30 días antes
              </h2>
              <p>
                Si cancelas entre 15 y 30 días antes de tu llegada, se reembolsará el 70% del total pagado.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                Cancelación menos de 15 días
              </h2>
              <p>
                Las cancelaciones realizadas menos de 15 días antes de la llegada no son reembolsables.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                Cambio de Fechas
              </h2>
              <p>
                Puedes cambiar tus fechas de reservación sin penalización hasta 30 días antes de tu llegada, sujeto a disponibilidad.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                Cómo Cancelar
              </h2>
              <p>
                Para cancelar, contáctanos por email a reservas@paraisoencantado.com o por teléfono al +52 489 100 7679. La cancelación será procesada en un plazo de 5-7 días hábiles.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                Fuerza Mayor
              </h2>
              <p>
                En caso de eventos de fuerza mayor (desastres naturales, pandemias, etc.), ofrecemos reprogramación sin penalización.
              </p>
            </section>

            <div className="bg-pergamino p-6 rounded-lg mt-8">
              <h3 className="font-display text-xl text-selva mb-2">
                ¿Preguntas?
              </h3>
              <p>
                Contáctanos y resolveremos cualquier duda sobre cancelaciones y cambios.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
