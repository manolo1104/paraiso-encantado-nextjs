import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, MessageCircle, MapPin, CalendarCheck, Mail, Clock } from 'lucide-react';
import styles from './contacto.module.css';

export const metadata: Metadata = {
  title: 'Contacto | Hotel Paraíso Encantado · Xilitla, SLP',
  description:
    'Contáctanos por WhatsApp, teléfono o correo. Reserva directamente y obtén el mejor precio. Hotel Paraíso Encantado en Xilitla, Huasteca Potosina.',
};

const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';
const WHATSAPP_URL = 'https://wa.me/524891007679';
const MAPS_URL = 'https://www.google.com/maps/place/Hotel+Paraiso+Encantado/@21.3842,-99.0033,17z';

export default function ContactoPage() {
  return (
    <main className={styles.main}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <span>Contacto</span>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Estamos para ayudarte</p>
        <h1 className={styles.heroTitle}>
          Hablemos de tu <em>Escapada</em>
        </h1>
        <p className={styles.heroDesc}>
          Resolvemos tus dudas y te ayudamos a elegir la suite perfecta.
          Respondemos en menos de 2 horas por WhatsApp.
        </p>
      </section>

      {/* Botones de acción rápida */}
      <section className={styles.actionsSection}>
        <div className={styles.actionsGrid}>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.actionCard} ${styles.actionWhatsapp}`}
          >
            <div className={styles.actionIcon}>
              <MessageCircle size={32} strokeWidth={1.5} />
            </div>
            <div className={styles.actionContent}>
              <h2>WhatsApp</h2>
              <p>Respuesta en menos de 2 horas. La forma más rápida de contactarnos.</p>
              <span className={styles.actionLink}>Escribir por WhatsApp →</span>
            </div>
          </a>

          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.actionCard} ${styles.actionReserva}`}
          >
            <div className={styles.actionIcon}>
              <CalendarCheck size={32} strokeWidth={1.5} />
            </div>
            <div className={styles.actionContent}>
              <h2>Motor de Reservas</h2>
              <p>Verifica disponibilidad y reserva en línea con confirmación instantánea.</p>
              <span className={styles.actionLink}>Reservar ahora →</span>
            </div>
          </a>

          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.actionCard} ${styles.actionMaps}`}
          >
            <div className={styles.actionIcon}>
              <MapPin size={32} strokeWidth={1.5} />
            </div>
            <div className={styles.actionContent}>
              <h2>Cómo Llegarnos</h2>
              <p>Xilitla, San Luis Potosí. A 5 minutos caminando del Jardín de Edward James.</p>
              <span className={styles.actionLink}>Ver en Google Maps →</span>
            </div>
          </a>

        </div>
      </section>

      {/* Información de contacto */}
      <section className={styles.infoSection}>
        <div className={styles.infoGrid}>

          <div className={styles.infoBlock}>
            <h3>Teléfonos</h3>
            <ul className={styles.contactList}>
              <li>
                <Phone size={16} strokeWidth={1.5} />
                <div>
                  <a href="tel:+524891007679">+52 489-100-7679</a>
                  <span>Reservaciones y atención general</span>
                </div>
              </li>
              <li>
                <Phone size={16} strokeWidth={1.5} />
                <div>
                  <a href="tel:+524891007601">+52 489-100-7601</a>
                  <span>Línea directa de recepción</span>
                </div>
              </li>
            </ul>
          </div>

          <div className={styles.infoBlock}>
            <h3>WhatsApp</h3>
            <ul className={styles.contactList}>
              <li>
                <MessageCircle size={16} strokeWidth={1.5} />
                <div>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    +52 489-100-7679
                  </a>
                  <span>Lunes a domingo, 8 am – 9 pm</span>
                </div>
              </li>
            </ul>
          </div>

          <div className={styles.infoBlock}>
            <h3>Correo Electrónico</h3>
            <ul className={styles.contactList}>
              <li>
                <Mail size={16} strokeWidth={1.5} />
                <div>
                  <a href="mailto:reservas@paraisoencantado.com">
                    reservas@paraisoencantado.com
                  </a>
                  <span>Reservas y cotizaciones grupales</span>
                </div>
              </li>
            </ul>
          </div>

          <div className={styles.infoBlock}>
            <h3>Horarios</h3>
            <ul className={styles.contactList}>
              <li>
                <Clock size={16} strokeWidth={1.5} />
                <div>
                  <strong>Check-in:</strong>
                  <span>15:00 hrs en adelante</span>
                </div>
              </li>
              <li>
                <Clock size={16} strokeWidth={1.5} />
                <div>
                  <strong>Check-out:</strong>
                  <span>antes de las 12:00 hrs</span>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Mapa */}
      <section className={styles.mapSection}>
        <div className={styles.mapHeader}>
          <h2>Cómo <em>Llegarnos</em></h2>
          <p>
            Xilitla, San Luis Potosí · Huasteca Potosina, México<br />
            A 5 minutos caminando del Jardín Surrealista de Edward James (Las Pozas)
          </p>
        </div>
        <div className={styles.mapWrap}>
          <iframe
            title="Ubicación Hotel Paraíso Encantado en Xilitla"
            src="https://maps.google.com/maps?q=Hotel+Paraiso+Encantado+Xilitla&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className={styles.mapFrame}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className={styles.distanceRow}>
          {[
            { city: 'CDMX', time: '~5.5 hrs', km: '460 km' },
            { city: 'Monterrey', time: '~5 hrs', km: '430 km' },
            { city: 'SLP', time: '~3 hrs', km: '250 km' },
            { city: 'Tampico', time: '~2.5 hrs', km: '200 km' },
          ].map((d) => (
            <div key={d.city} className={styles.distanceItem}>
              <strong>{d.city}</strong>
              <span>{d.time}</span>
              <span className={styles.km}>{d.km}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
