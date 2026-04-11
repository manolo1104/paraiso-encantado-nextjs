import Link from 'next/link';
import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Hotel Paraíso Encantado · Xilitla',
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
          <p>Utilizamos Google Tag Manager para analíticas de uso del sitio web (datos anónimos). Puede desactivar las cookies en la configuración de su navegador.</p>
        </section>

        <section>
          <h2>Sus Derechos</h2>
          <p>Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), usted tiene derecho de Acceso, Rectificación, Cancelación y Oposición (ARCO) sobre sus datos personales. Contáctenos en <a href="mailto:reservas@paraisoencantado.com">reservas@paraisoencantado.com</a>.</p>
        </section>

        <p className={styles.lastUpdate}>Última actualización: Enero 2026</p>
        <Link href="/" className={styles.backBtn}>← Volver al inicio</Link>
      </div>
    </main>
  );
}
