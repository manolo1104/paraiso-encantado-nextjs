import Link from 'next/link';
import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Política de Cancelación | Hotel Paraíso Encantado · Xilitla',
};

export default function PoliticaCancelacion() {
  return (
    <main className={styles.main}>
      <nav className={styles.breadcrumb}>
        <Link href="/">Inicio</Link>
        <span> / </span>
        <span>Política de Cancelación</span>
      </nav>
      <div className={styles.content}>
        <h1>Política de Cancelación</h1>
        <p className={styles.subtitle}>Hotel Paraíso Encantado · Xilitla, San Luis Potosí</p>

        <section>
          <h2>Cancelación Gratuita</h2>
          <p>Las reservaciones pueden cancelarse sin cargo hasta <strong>48 horas antes</strong> de la fecha de llegada (check-in: 15:00 hrs hora local).</p>
        </section>

        <section>
          <h2>Cancelación con Cargo</h2>
          <p>Las cancelaciones realizadas con menos de 48 horas de anticipación o la no presentación (no-show) implican un cargo equivalente a <strong>1 noche de alojamiento</strong> sobre la tarifa reservada.</p>
        </section>

        <section>
          <h2>Modificaciones de Reserva</h2>
          <p>Las modificaciones de fecha están sujetas a disponibilidad. Se aceptan sin costo con 72 horas de anticipación. Las modificaciones de último minuto están sujetas a disponibilidad y pueden implicar un ajuste de tarifa.</p>
        </section>

        <section>
          <h2>Paquetes y Tarifas Especiales</h2>
          <p>Las tarifas no reembolsables o paquetes con descuento especial tienen sus propias condiciones de cancelación, indicadas al momento de la reserva.</p>
        </section>

        <section>
          <h2>Proceso de Reembolso</h2>
          <p>Los reembolsos se procesan en un plazo de <strong>5 a 10 días hábiles</strong> al método de pago original. Para solicitar una cancelación o reembolso, comuníquese a través de:</p>
          <ul>
            <li>WhatsApp: <a href="https://wa.me/524891007679">+52 489-100-7679</a></li>
            <li>Email: <a href="mailto:reservas@paraisoencantado.com">reservas@paraisoencantado.com</a></li>
          </ul>
        </section>

        <p className={styles.lastUpdate}>Última actualización: Enero 2026</p>
        <Link href="/" className={styles.backBtn}>← Volver al inicio</Link>
      </div>
    </main>
  );
}
