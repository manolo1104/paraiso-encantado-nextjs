import Link from 'next/link';
import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Hotel Paraíso Encantado · Xilitla',
  alternates: { canonical: 'https://www.paraisoencantado.com/politica-privacidad' },
  robots: { index: false, follow: true },
};

export default function PoliticaPrivacidad() {
  return (
    <main className={styles.main}>
      <nav className={styles.breadcrumb}>
        <Link href="/">Inicio</Link>
        <span> / </span>
        <span>Política de Privacidad</span>
      </nav>
      <div className={styles.content}>
        <h1>Política de Privacidad</h1>
        <p className={styles.subtitle}>Hotel Paraíso Encantado · Xilitla, San Luis Potosí</p>

        <section>
          <h2>Información que Recopilamos</h2>
          <p>Recopilamos únicamente la información necesaria para procesar su reservación: nombre completo, correo electrónico, número de teléfono y datos de pago. Los datos de pago son procesados de forma segura por Stripe y no son almacenados en nuestros servidores.</p>
        </section>

        <section>
          <h2>Uso de la Información</h2>
          <p>Su información se utiliza exclusivamente para:</p>
          <ul>
            <li>Confirmar y gestionar su reservación</li>
            <li>Comunicarnos con usted respecto a su estadía</li>
            <li>Enviar confirmaciones y facturas</li>
            <li>Mejorar nuestros servicios (datos anónimos y agregados)</li>
          </ul>
        </section>

        <section>
          <h2>Compartición de Datos</h2>
          <p>No vendemos, cedemos ni compartimos su información personal con terceros, excepto cuando sea requerido por ley o sea estrictamente necesario para procesar su reservación (e.g., procesador de pagos).</p>
        </section>

        <section>
          <h2>Cookies y Analíticas</h2>
          <p>Utilizamos Google Tag Manager para analíticas de uso del sitio web (datos anónimos).</p>
          <p>También utilizamos <strong>Microsoft Clarity</strong>, que registra de forma automática cómo se navega por el sitio: páginas visitadas, clics, desplazamiento y movimientos del cursor. Esa información se reproduce después como una grabación anónima de la visita y como mapas de calor, y nos sirve para detectar qué partes del sitio confunden o estorban.</p>
          <p>Estas grabaciones <strong>no incluyen sus datos personales</strong>: los campos de los formularios (nombre, correo, teléfono, peticiones especiales) y los datos que aparecen en pantalla durante la reserva se transmiten ocultos, y los datos de su tarjeta nunca son visibles porque se capturan directamente en el entorno seguro de nuestro procesador de pagos. Tampoco se graba el panel interno de administración del hotel.</p>
          <p>Puede desactivar las cookies en la configuración de su navegador, o bloquear la medición mediante la <a href="https://privacy.microsoft.com/es-mx/privacystatement" target="_blank" rel="noopener noreferrer">declaración de privacidad de Microsoft</a>, que explica cómo trata esta información.</p>
        </section>

        <section>
          <h2>Sus Derechos</h2>
          <p>Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), usted tiene derecho de Acceso, Rectificación, Cancelación y Oposición (ARCO) sobre sus datos personales. Contáctenos en <a href="mailto:reservas@paraisoencantado.com">reservas@paraisoencantado.com</a>.</p>
        </section>

        <p className={styles.lastUpdate}>Última actualización: Octubre 2026</p>
        <Link href="/" className={styles.backBtn}>← Volver al inicio</Link>
      </div>
    </main>
  );
}
