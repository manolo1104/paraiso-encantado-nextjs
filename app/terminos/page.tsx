

export const metadata = {
  title: 'Términos y Condiciones | Paraiso Encantado',
  description: 'Lee nuestros términos y condiciones de servicio.',
};

export default function TerminosPage() {
  return (
    <main className="w-full">
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl text-selva mb-12">
            Términos y Condiciones
          </h1>

          <div className="font-body text-gray-700 space-y-6 prose prose-lg">
            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                1. Aceptación de los Términos
              </h2>
              <p>
                Al utilizar este sitio web y reservar con Paraiso Encantado, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte, por favor no utilices nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                2. Reservaciones
              </h2>
              <p>
                Las reservaciones están sujetas a disponibilidad. El depósito requerido para confirmar tu reservación es del 30% del total. El saldo debe cubrirse 15 días antes de la llegada.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                3. Política de Cancelación
              </h2>
              <p>
                Ver nuestra política de cancelación para más detalles sobre reembolsos y cambios de fechas.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                4. Responsabilidad Limitada
              </h2>
              <p>
                Paraiso Encantado no es responsable por daños incidentales, consecuentes o punitivos derivados del uso de nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                5. Modificaciones
              </h2>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán efectivos inmediatamente después de su publicación.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-jade mb-4">
                6. Ley Aplicable
              </h2>
              <p>
                Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta en los tribunales de San Luis Potosí.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
