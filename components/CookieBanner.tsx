'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './CookieBanner.module.css';

const STORAGE_KEY = 'pe_cookies_accepted';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, '0');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.banner} role="region" aria-label="Aviso de cookies">
      <p className={styles.text}>
        Usamos cookies para mejorar tu experiencia y mostrarte contenido relevante.
        Al continuar navegando aceptas su uso.{' '}
        <Link href="/politica-privacidad" className={styles.link}>
          Más información
        </Link>
      </p>
      <div className={styles.actions}>
        <button onClick={accept} className={styles.btnAccept}>
          Aceptar
        </button>
        <button onClick={decline} className={styles.btnDecline}>
          Rechazar
        </button>
      </div>
    </div>
  );
}
