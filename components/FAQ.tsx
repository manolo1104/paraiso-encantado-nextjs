'use client';

import { useState } from 'react';
import { MessageCircle, Plus, Minus } from 'lucide-react';
import styles from './FAQ.module.css';

const faqs = [
  {
    question: '¿Qué tan cerca está del Jardín de Edward James?',
    answer:
      'A 5 minutos caminando (aproximadamente 400 metros). Literalmente puedes desayunar en El Papán y a las 9am ya estás en la entrada de Las Pozas. Somos el hotel MÁS cercano al jardín surrealista de todo Xilitla.',
  },
  {
    question: '¿El desayuno está incluido en el precio?',
    answer:
      'El desayuno no está incluido en la tarifa de habitación. Nuestro restaurante El Papán Huasteco sirve desayunos auténticos entre $100 y $200 MXN: tortillas hechas a mano en comal, zacahuil y café de olla.',
  },
  {
    question: '¿Puedo cancelar mi reserva sin cargo?',
    answer:
      'Sí. Puedes cancelar hasta 48 horas antes de tu llegada sin ningún cargo. Reembolsamos el 100% de tu pago a tu tarjeta en 5-7 días hábiles. Nuestra política es más flexible que la de las OTAs (Booking, Expedia), que generalmente solo permiten cancelación 24hrs.',
  },
  {
    question: '¿Es seguro pagar en línea?',
    answer:
      '100% seguro. Utilizamos Stripe, el mismo sistema de pago que usan Amazon y Uber. Tu información bancaria está encriptada de extremo a extremo. Nunca almacenamos datos de tarjetas en nuestros servidores. Recibes confirmación instantánea por email después del pago.',
  },
  {
    question: '¿Qué incluye la tarifa de habitación?',
    answer:
      'Incluye: suite con todas las amenidades, WiFi de alta velocidad, estacionamiento privado gratuito, acceso a piscina spa, toallas y amenidades de baño, spa privado (en suites que lo incluyen). No incluye: desayunos ($100–200 MXN), tours a Las Pozas y masajes terapéuticos.',
  },
  {
    question: '¿Cuántas personas caben por habitación?',
    answer:
      'Varía según la suite: Habitaciones Standard: 2–4 personas. Suites Plus/Master: 4 personas. Suites Familiares (Helechos): hasta 6–8 personas. El precio base es para 2 personas. Persona adicional: +$300 MXN por noche.',
  },
  {
    question: '¿Necesito coche para llegar al hotel?',
    answer:
      'Con auto propio es ideal. Estamos a 7 min del centro de Xilitla y te enviamos ubicación GPS exacta por WhatsApp. Sin auto: puedes tomar autobús ADO hasta Xilitla centro, luego taxi ($50 MXN) o te recogemos gratis si reservas 3+ noches.',
  },
  {
    question: '¿Aceptan mascotas?',
    answer:
      'Actualmente no aceptamos mascotas en las habitaciones. Estamos trabajando en una política pet-friendly para el futuro cercano. Te recomendamos contactarnos directamente si tienes necesidades especiales.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.section} id="faq" aria-label="Preguntas frecuentes">
      <div className={styles.sectionHeader}>
        <h2>
          Preguntas <em>Frecuentes</em>
        </h2>
        <p className={styles.subtitle}>Todo lo que necesitas saber antes de reservar</p>
      </div>

      <div className={styles.list} role="list">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}
              role="listitem"
            >
              <button
                className={styles.question}
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
              >
                <span>{faq.question}</span>
                <span className={styles.icon} aria-hidden="true">
                  {isOpen ? <Minus size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
                </span>
              </button>

              <div
                id={`faq-answer-${index}`}
                className={styles.answer}
                hidden={!isOpen}
                role="region"
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.cta}>
        <p>¿Tienes otra pregunta?</p>
        <a
          href="https://wa.me/524891007679"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappBtn}
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={16} strokeWidth={1.5} />
          Pregúntanos por WhatsApp
        </a>
      </div>
    </section>
  );
}
