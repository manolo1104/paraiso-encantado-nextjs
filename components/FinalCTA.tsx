'use client';

import { CheckCircle, Phone, MessageCircle, Mail } from 'lucide-react';
import { track } from '@/lib/track';
import styles from './FinalCTA.module.css';

export default function FinalCTA() {
  return (
    <section className={styles.section} aria-label="Reserva ahora">
      <div className={styles.content}>
        <h2>
          ¿Listo para Tu Escapada a la <em>Huasteca</em>?
        </h2>

        <p className={styles.subtitle}>
          Solo 13 suites disponibles. Reserva hoy y asegura tu lugar
          en el hotel más cercano al Jardín de Edward James.
        </p>

        <a
          href="/reservar"
          className={styles.ctaBtn}
          aria-label="Asegura tu escapada — confirmación instantánea"
        >
          Asegura Tu Escapada
        </a>

        <ul className={styles.guarantees} role="list" aria-label="Garantías">
          <li><CheckCircle size={14} strokeWidth={2} /> Pago 100% seguro</li>
          <li><CheckCircle size={14} strokeWidth={2} /> Cancela hasta 48hrs antes</li>
          <li><CheckCircle size={14} strokeWidth={2} /> Confirmación instantánea</li>
        </ul>

        <div className={styles.alternatives} aria-label="Otras formas de contacto">
          <a href="tel:+524891007679" className={styles.altLink}
            onClick={() => track('clic_telefono', { number: '+524891007679', source: 'final_cta' }, true)}>
            <Phone size={15} strokeWidth={1.5} />
            489-100-7679
          </a>
          <a
            href="https://wa.me/524891007679"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.altLink}
            onClick={() => track('clic_whatsapp', { source: 'final_cta' }, true)}
          >
            <MessageCircle size={15} strokeWidth={1.5} />
            WhatsApp
          </a>
          <a href="mailto:reservas@paraisoencantado.com" className={styles.altLink}>
            <Mail size={15} strokeWidth={1.5} />
            reservas@paraisoencantado.com
          </a>
        </div>
      </div>
    </section>
  );
}
