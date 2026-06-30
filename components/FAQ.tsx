'use client';

import { useState } from 'react';
import { MessageCircle, Plus, Minus } from 'lucide-react';
import styles from './FAQ.module.css';

const faqs = [
  {
    question: '¿Qué tan cerca está del Jardín de Edward James?',
    answer:
      'A 5 minutos caminando, unos 400 metros. Puedes desayunar en El Papán y a las 9 de la mañana ya estar en la entrada de Las Pozas. Somos el hotel más cercano al Jardín de Edward James en Xilitla.',
  },
  {
    question: '¿El desayuno está incluido en el precio?',
    answer:
      'No está incluido en la tarifa. Nuestro restaurante El Papán Huasteco sirve desayunos de $100 a $200 MXN: tortillas hechas a mano en comal, zacahuil y café de olla.',
  },
  {
    question: '¿Puedo cancelar mi reserva sin cargo?',
    answer:
      'Sí. Reembolsamos el 100% si cancelas hasta 7 días antes de tu llegada, el 50% hasta 3 días antes, y con menos de 72 horas no hay reembolso pero puedes cambiar la fecha. Los reembolsos se procesan en 5 a 10 días hábiles.',
  },
  {
    question: '¿Con cuánto se confirma la reserva?',
    answer:
      '1 noche: se cobra el 100% al confirmar en línea. 2 noches o más: pagas el 50% ahora y el 50% restante en el hotel al llegar (efectivo, tarjeta o transferencia). El pago en línea es seguro, con Stripe.',
  },
  {
    question: '¿Cuántas personas caben por habitación?',
    answer:
      'Entre 2 y 8 personas según la suite. Las suites estándar admiten 2 a 4 personas; las familiares Helechos hasta 6 u 8. El precio base es para 2 personas; persona adicional, +$300 MXN por noche.',
  },
  {
    question: '¿Necesito coche para llegar al hotel?',
    answer:
      'Con auto propio es lo ideal: hay estacionamiento privado gratuito. Sin auto, puedes llegar en autobús a Xilitla centro y luego tomar un taxi (unos $50 MXN); te enviamos la ubicación exacta por WhatsApp.',
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
                inert={!isOpen}
                role="region"
              >
                <div className={styles.answerInner}>
                  <p>{faq.answer}</p>
                </div>
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
