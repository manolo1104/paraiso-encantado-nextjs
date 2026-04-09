import Link from 'next/link';

export default function ConfirmacionPage() {
  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-pergamino to-arena">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Checkmark */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-brote rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="font-display text-5xl md:text-6xl text-selva mb-4">
            ¡Reserva Confirmada!
          </h1>

          <p className="font-body text-lg text-gray-700 mb-8 max-w-xl mx-auto">
            Tu solicitud ha sido recibida. Recibirás un email de confirmación con todos los detalles
            de tu reserva en los próximos 24 horas.
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-brote">
            <h3 className="font-display text-2xl text-selva mb-4">Próximos pasos:</h3>
            <ul className="font-body text-left space-y-3 text-gray-700 max-w-md mx-auto">
              <li className="flex items-start">
                <span className="text-brote font-bold mr-3">1.</span>
                <span>Revisa tu email para la confirmación y detalles de pago</span>
              </li>
              <li className="flex items-start">
                <span className="text-brote font-bold mr-3">2.</span>
                <span>Realiza el pago para asegurar tu reserva</span>
              </li>
              <li className="flex items-start">
                <span className="text-brote font-bold mr-3">3.</span>
                <span>Te enviaremos información de check-in una semana antes</span>
              </li>
              <li className="flex items-start">
                <span className="text-brote font-bold mr-3">4.</span>
                <span>¡Disfruta tu experiencia en Paraiso Encantado!</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <p className="font-body text-gray-600">
              ¿Preguntas? Contáctanos por WhatsApp:{' '}
              <a
                href="https://wa.me/5248910007679"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brote hover:underline font-semibold"
              >
                +52-489-100-7679
              </a>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/"
                className="inline-block bg-selva hover:bg-jade text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Volver al Inicio
              </Link>
              <Link
                href="/habitaciones"
                className="inline-block bg-brote hover:bg-ambar text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors"
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
