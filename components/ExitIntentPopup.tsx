'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, Mail } from 'lucide-react';
import styles from './ExitIntentPopup.module.css';

const STORAGE_KEY = 'pe_exit_shown';
const DELAY_MS = 8000; // show on mobile after 8s idle

export default function ExitIntentPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Don't show on booking flow, admin, or confirmation pages
  const blocked = pathname.startsWith('/reservar') || pathname.startsWith('/admin') || pathname.includes('confirmacion');

  const tryShow = useCallback(() => {
    if (blocked) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(true);
  }, [blocked]);

  useEffect(() => {
    if (blocked) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Desktop: exit intent on mouse leaving viewport from top
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY < 10) tryShow();
    }
    document.addEventListener('mouseleave', onMouseLeave);

    // Mobile / fallback: show after DELAY_MS of inactivity
    const timer = setTimeout(tryShow, DELAY_MS);

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      clearTimeout(timer);
    };
  }, [blocked, tryShow]);

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
      if (res.ok) setStatus('success');
    } catch { /* silent */ }
  }

  if (!visible) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Obtén la Guía Secreta de Xilitla">
      <div className={styles.modal}>
        <button
          className={styles.close}
          onClick={() => setVisible(false)}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className={styles.imgStrip} aria-hidden="true">
          <span className={styles.badge}>GRATIS</span>
        </div>

        <div className={styles.body}>
          {status === 'success' ? (
            <div className={styles.success}>
              <span className={styles.successCheck}>✓</span>
              <p className={styles.successTitle}>¡Perfecto, revisa tu correo!</p>
              <p className={styles.successSub}>Tu guía llega en minutos. Revisa también el spam.</p>
              <button className={styles.successClose} onClick={() => setVisible(false)}>
                Continuar explorando →
              </button>
            </div>
          ) : (
            <>
              <p className={styles.eyebrow}>Antes de irte</p>
              <h2 className={styles.title}>
                Llévate la <em>Guía Secreta</em><br />de Xilitla
              </h2>
              <ul className={styles.list}>
                <li>Pozas ocultas que los tours no muestran</li>
                <li>Mejor hora para entrar a Las Pozas sin turistas</li>
                <li>Senderos secretos cerca del hotel</li>
                <li>Acceso anticipado a tarifas exclusivas</li>
              </ul>
              <form onSubmit={handleSubmit} className={styles.form} noValidate>
                <div className={styles.inputRow}>
                  <Mail size={15} className={styles.mailIcon} aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    aria-label="Tu correo electrónico"
                    disabled={status === 'loading'}
                    className={styles.input}
                  />
                </div>
                <button type="submit" className={styles.btn} disabled={status === 'loading' || !email}>
                  {status === 'loading' ? 'Enviando…' : 'Quiero la guía gratis'}
                </button>
              </form>
              <p className={styles.legal}>Sin spam. Un clic para darte de baja.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
