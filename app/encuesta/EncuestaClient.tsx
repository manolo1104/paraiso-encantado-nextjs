'use client';

/**
 * Encuesta de 1 minuto, enviada un día después del check-out.
 *
 * Reglas de diseño, en orden de importancia:
 * - Se responde con el pulgar: escalas de toque de 44px, una columna, sin zoom.
 *   Casi todos la abren desde el correo en el celular.
 * - La estrella general ya viene contestada desde el correo, así que entra con la
 *   primera pregunta hecha. Eso es lo que sostiene la tasa de respuesta.
 * - Las preguntas viven en `preguntas.ts`, con el criterio de qué merece estar ahí.
 * - La invitación a reseñar en Google aparece SOLO con 4 o 5 estrellas. Pedirle
 *   reseña pública a quien la pasó mal es la forma más rápida de conseguir una
 *   reseña de una estrella.
 */
import { useState } from 'react';
import Link from 'next/link';
import styles from './encuesta.module.css';
import { ESCALAS, TOUR, LLEGADA, ABIERTA, NPS } from './preguntas';

const REVIEW_URL = 'https://g.page/r/CY84xO7VaxDbEBM/review';
const WA_URL = 'https://wa.me/524891007679';

export default function EncuestaClient({
  conf, ratingInicial,
}: { conf: string; ratingInicial: number }) {
  const [rating, setRating] = useState(ratingInicial);
  const [escalas, setEscalas] = useState<Record<string, number>>({});
  const [llegada, setLlegada] = useState('');
  const [tomoTour, setTomoTour] = useState<boolean | null>(null);
  const [guia, setGuia] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) { setError('Elige cuántas estrellas nos das.'); return; }
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conf, rating, comment,
          detalle: {
            ...escalas,
            llegada,
            tour: tomoTour === null ? '' : tomoTour ? 'sí' : 'no',
            guia: tomoTour ? guia : undefined,
            nps: nps ?? undefined,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setEnviado(true);
    } catch {
      setError('No se pudo enviar. Intenta de nuevo o escríbenos por WhatsApp.');
      setEnviando(false);
    }
  }

  if (enviado) {
    const contento = rating >= 4;
    return (
      <div className={styles.card}>
        <p className={styles.eyebrow}>Gracias</p>
        <h1 className={styles.title}>
          {contento ? <>Nos alegra que la hayas <em>pasado bien</em></> : <>Gracias por decírnoslo</>}
        </h1>
        {contento ? (
          <>
            <p className={styles.body}>
              Si tienes treinta segundos más, una reseña en Google es lo que más ayuda a un hotel
              pequeño como el nuestro. Las leemos todas.
            </p>
            <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn}>
              Escribir mi reseña en Google
            </a>
          </>
        ) : (
          <>
            <p className={styles.body}>
              Lo que nos dijiste no se queda en una hoja de cálculo: lo revisa el dueño. Si quieres
              que te contactemos para resolverlo, escríbenos y te respondemos personalmente.
            </p>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn}>
              Escribirnos por WhatsApp
            </a>
          </>
        )}
        <Link href="/" className={styles.secondaryLink}>Volver al inicio</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.card}>
      <p className={styles.eyebrow}>Un minuto{conf ? ` · Reserva ${conf}` : ''}</p>
      <h1 className={styles.title}>¿Cómo estuvo tu <em>estancia</em>?</h1>
      <p className={styles.body}>
        Son toques, no textos. Lo usamos para arreglar lo que haga falta antes de que le toque al
        siguiente huésped.
      </p>

      {/* General */}
      <fieldset className={styles.field}>
        <legend className={styles.legend}>En general</legend>
        <div className={styles.stars} role="radiogroup" aria-label="Calificación general">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} de 5 estrellas`}
              className={`${styles.star} ${n <= rating ? styles.starOn : ''}`}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      {/* Escalas por aspecto */}
      {ESCALAS.map(a => (
        <fieldset key={a.key} className={styles.field}>
          <legend className={styles.legend}>
            {a.label}{a.opcional && <span className={styles.opt}> (si aplica)</span>}
          </legend>
          {a.hint && <p className={styles.hint}>{a.hint}</p>}
          <div className={styles.scale} role="radiogroup" aria-label={a.label}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={escalas[a.key] === n}
                className={`${styles.scaleBtn} ${escalas[a.key] === n ? styles.scaleOn : ''}`}
                onClick={() => setEscalas(prev => ({ ...prev, [a.key]: n }))}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      {/* Llegada */}
      <fieldset className={styles.field}>
        <legend className={styles.legend}>{LLEGADA.pregunta}</legend>
        <div className={styles.chips}>
          {LLEGADA.opciones.map(op => (
            <button
              key={op}
              type="button"
              aria-pressed={llegada === op}
              className={`${styles.chip} ${llegada === op ? styles.chipOn : ''}`}
              onClick={() => setLlegada(llegada === op ? '' : op)}
            >
              {op}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Tour (condicional) */}
      <fieldset className={styles.field}>
        <legend className={styles.legend}>{TOUR.pregunta}</legend>
        <div className={styles.chips}>
          <button
            type="button"
            aria-pressed={tomoTour === false}
            className={`${styles.chip} ${tomoTour === false ? styles.chipOn : ''}`}
            onClick={() => { setTomoTour(false); setGuia(0); }}
          >
            {TOUR.noLabel}
          </button>
          <button
            type="button"
            aria-pressed={tomoTour === true}
            className={`${styles.chip} ${tomoTour === true ? styles.chipOn : ''}`}
            onClick={() => setTomoTour(true)}
          >
            {TOUR.siLabel}
          </button>
        </div>
        {tomoTour && (
          <div className={styles.sub}>
            <p className={styles.legend} style={{ marginTop: 14 }}>{TOUR.escalaLabel}</p>
            <div className={styles.scale} role="radiogroup" aria-label={TOUR.escalaLabel}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={guia === n}
                  className={`${styles.scaleBtn} ${guia === n ? styles.scaleOn : ''}`}
                  onClick={() => setGuia(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      {/* NPS */}
      <fieldset className={styles.field}>
        <legend className={styles.legend}>{NPS.pregunta}</legend>
        <div className={styles.nps} role="radiogroup" aria-label={NPS.pregunta}>
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={nps === n}
              className={`${styles.npsBtn} ${nps === n ? styles.scaleOn : ''}`}
              onClick={() => setNps(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className={styles.npsLabels}>
          <span>{NPS.minLabel}</span><span>{NPS.maxLabel}</span>
        </div>
      </fieldset>

      {/* Abierta */}
      <fieldset className={styles.field}>
        <legend className={styles.legend}>
          {ABIERTA.label} <span className={styles.opt}>(opcional)</span>
        </legend>
        <textarea
          className={styles.textarea}
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={ABIERTA.placeholder}
        />
      </fieldset>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.primaryBtn} disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar'}
      </button>
      <p className={styles.note}>No publicamos tu nombre ni tus respuestas.</p>
    </form>
  );
}
