'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, Mail } from 'lucide-react';
import { track } from '@/lib/track';
import styles from './ExitIntentPopup.module.css';

const STORAGE_KEY = 'pe_exit_shown';

// Antes eran 8 segundos. En celular —de donde viene el 88% de las visitas de
// Google— no existe la "intención de salida" del ratón, así que ese
// temporizador solo servía para taparle la pantalla a alguien que llevaba
// ocho segundos leyendo, que es exactamente cuando apenas está enganchando.
const ESPERA_MS = 25000;

// Y además tiene que haber leído algo: el popup se gana con el 40% de la
// página vista, no con el reloj.
const SCROLL_MINIMO = 0.4;

/** Qué parte de la página lleva vista el visitante, de 0 a 1. */
function profundidadDeScroll(): number {
  const alto = document.documentElement.scrollHeight;
  const visible = window.innerHeight;
  // Una página que cabe entera en la pantalla ya está leída al 100%: sin esta
  // salida el popup no aparecería nunca en /contacto ni en /reviews.
  if (alto <= visible) return 1;
  return Math.min(1, (window.scrollY + visible) / alto);
}

/** En navegación privada sessionStorage truena; ahí se muestra una vez por carga. */
function yaSeMostro(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function marcarComoMostrado(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* sin almacenamiento: no se puede recordar, y no pasa nada */
  }
}

export default function ExitIntentPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Don't show on booking flow, admin, or confirmation pages
  // Fuera de cualquier página donde el visitante ya está haciendo algo: reservar,
  // pagar, o responder la encuesta post-estancia. Pedirle el correo a un huésped
  // que ya se hospedó —y que está a media encuesta— tapa la pregunta y sobra.
  const blocked =
    pathname.startsWith('/reservar') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/encuesta') ||
    pathname.startsWith('/gracias-por-tu-opinion') ||
    pathname.includes('confirmacion');

  const mostrar = useCallback((motivo: string) => {
    if (blocked) return;
    if (yaSeMostro()) return;
    const profundidad = profundidadDeScroll();
    if (profundidad < SCROLL_MINIMO) return;
    marcarComoMostrado();
    setVisible(true);
    track('popup_mostrado', {
      motivo,
      profundidad: Math.round(profundidad * 100),
    });
  }, [blocked]);

  useEffect(() => {
    if (blocked) return;
    if (yaSeMostro()) return;

    // Escritorio: el ratón sale por arriba de la ventana = se está yendo.
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY < 10) mostrar('intencion_salida');
    }
    document.addEventListener('mouseleave', onMouseLeave);

    // Celular y respaldo: 25 segundos de lectura. Si al cumplirse todavía no
    // ha bajado el 40%, el popup espera a que lo haga en lugar de descartarse:
    // el que lee despacio es justo el que sí quiere la guía.
    let esperaCumplida = false;
    function onScroll() {
      if (esperaCumplida) mostrar('tiempo_y_scroll');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = setTimeout(() => {
      esperaCumplida = true;
      mostrar('tiempo_y_scroll');
    }, ESPERA_MS);

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [blocked, mostrar]);

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
      if (res.ok) {
        setStatus('success');
        // Es un correo capturado, no una reserva: no va como conversión de
        // Google Ads, pero sí necesita nombre propio para poder comparar
        // cuántos se muestran contra cuántos dejan el correo. Hasta hoy el
        // popup no medía nada y no había forma de saber si aportaba o estorbaba.
        track('popup_convertido', { origen: 'popup_guia' });
      }
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
