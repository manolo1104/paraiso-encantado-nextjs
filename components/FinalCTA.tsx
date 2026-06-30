'use client';

import { CheckCircle, Phone, MessageCircle, Mail } from 'lucide-react';
import { track } from '@/lib/track';
import styles from './FinalCTA.module.css';
import FloatingLeaves from './FloatingLeaves';

export default function FinalCTA() {
  return (
    <section className={styles.section} aria-label="Reserva ahora">
      <FloatingLeaves count={16} />
      <div className={styles.content}>
        <h2>
          Tu escapada a la <em>Huasteca</em> empieza aquí
        </h2>

        <p className={styles.subtitle}>
          13 suites a cinco minutos de Las Pozas. Reserva directo con nosotros
          y vive Xilitla con calma.
        </p>

        <a
          href="/reservar"
          className={styles.ctaBtn}
          aria-label="Ver disponibilidad y reservar"
        >
          Ver disponibilidad
        </a>

        <ul className={styles.guarantees} role="list" aria-label="Garantías">
          <li><CheckCircle size={14} strokeWidth={2} /> Pago 100% seguro</li>
          <li><CheckCircle size={14} strokeWidth={2} /> Cancelación flexible</li>
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
