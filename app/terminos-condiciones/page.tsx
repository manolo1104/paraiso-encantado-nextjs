import Link from 'next/link';
import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Hotel Paraíso Encantado · Xilitla',
};

export default function TerminosCondiciones() {
  return (
    <main className={styles.main}>
      <nav className={styles.breadcrumb}>
        <Link href="/">Inicio</Link>
        <span> / </span>
        <span>Términos y Condiciones</span>
      </nav>
      <div className={styles.content}>
        <h1>Términos y Condiciones</h1>
        <p className={styles.subtitle}>Hotel Paraíso Encantado · Xilitla, San Luis Potosí</p>

        <section>
          <h2>Reservaciones</h2>
          <p>Las reservaciones quedan confirmadas una vez recibido el pago correspondiente. El hotel se reserva el derecho de cancelar reservaciones no garantizadas con pago.</p>
        </section>

        <section>
          <h2>Check-in y Check-out</h2>
          <ul>
            <li><strong>Check-in:</strong> 15:00 hrs</li>
            <li><strong>Check-out:</strong> 12:00 hrs</li>
            <li>Check-in anticipado y check-out tardío sujetos a disponibilidad y cargo adicional.</li>
          </ul>
        </section>

        <section>
          <h2>Uso de las Instalaciones</h2>
          <p>La alberca y áreas comunes están disponibles de 9:00 a 21:00 hrs. El restaurante El Papán Huasteco atiende de 8:00 a 20:00 hrs. Los huéspedes son responsables del uso adecuado de las instalaciones.</p>
        </section>

        <section>
          <h2>Responsabilidad</h2>
          <p>El hotel no se hace responsable por pérdida o daño de objetos de valor dejados en las habitaciones. Se recomienda usar la caja de seguridad disponible o depositarlos en la recepción.</p>
        </section>

        <section>
          <h2>Mascotas</h2>
          <p>No se admiten mascotas en las instalaciones del hotel, salvo previo acuerdo escrito con la administración.</p>
        </section>

        <section>
          <h2>Política de No Fumado</h2>
          <p>Está prohibido fumar dentro de las habitaciones. Hay áreas designadas para fumadores en el exterior del hotel.</p>
        </section>

        <section>
          <h2>Modificaciones</h2>
          <p>El hotel se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones aplican a reservaciones futuras.</p>
        </section>

        <p className={styles.lastUpdate}>Última actualización: Enero 2026</p>
        <Link href="/" className={styles.backBtn}>← Volver al inicio</Link>
      </div>
    </main>
  );
}
