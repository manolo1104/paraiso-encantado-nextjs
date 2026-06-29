'use client';

import { useState } from 'react';
import styles from './NewsletterSection.module.css';
import FloatingLeaves from './FloatingLeaves';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className={styles.section} aria-labelledby="newsletter-heading">
      <FloatingLeaves count={14} />
      <div className={styles.inner}>
        <div className={styles.iconWrap} aria-hidden="true">✦</div>
        <p className={styles.eyebrow}>Antes de tu viaje</p>
        <h2 id="newsletter-heading" className={styles.title}>
          Recibe nuestra <em>guía de Xilitla</em>
        </h2>
        <p className={styles.sub}>
          Pozas escondidas, senderos tranquilos y las mejores épocas para visitar.
          Y serás de los primeros en conocer nuestras tarifas de temporada.
        </p>

        {status === 'success' ? (
          <div className={styles.thanks}>
            <span className={styles.checkmark}>✓</span>
            <p>
              <strong>Listo.</strong> Tu guía llega en minutos.<br />
              Revisa tu bandeja (y el spam, por si acaso).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.inputWrap}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className={styles.input}
                required
                aria-label="Tu correo electrónico"
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                className={styles.btn}
                disabled={status === 'loading' || !email}
              >
                {status === 'loading' ? 'Enviando…' : 'Quiero la guía'}
              </button>
            </div>
            {status === 'error' && (
              <p className={styles.errorMsg}>Algo salió mal. Intenta de nuevo.</p>
            )}
            <p className={styles.legal}>
              Sin spam. Puedes darte de baja cuando quieras.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
