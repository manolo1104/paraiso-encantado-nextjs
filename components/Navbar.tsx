'use client';

import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cierra el menú al redimensionar a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav
      className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}
      aria-label="Navegación principal"
    >
      <div className={styles.navContainer}>
        {/* Logo */}
        <a href="/" className={styles.navLogo} aria-label="Paraíso Encantado - Inicio">
          <em>Paraíso Encantado</em>
        </a>

        {/* Links desktop */}
        <ul className={styles.navLinks} role="list">
          <li><a href="/">Inicio</a></li>
          <li><a href="/habitaciones">Habitaciones</a></li>
          <li><a href="/restaurante">Restaurante</a></li>
          <li><a href="/galeria">Galería</a></li>
          <li><a href="/experiencias">Experiencias</a></li>
          <li><a href="/#contacto">Contacto</a></li>
        </ul>

        {/* CTA Reservar */}
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navCta}
          aria-label="Reservar habitación"
        >
          Reservar
        </a>

        {/* Hamburger mobile */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Menú mobile */}
      <div
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}
        aria-hidden={!menuOpen}
      >
        <ul role="list">
          <li><a href="/" onClick={() => setMenuOpen(false)}>Inicio</a></li>
          <li><a href="/habitaciones" onClick={() => setMenuOpen(false)}>Habitaciones</a></li>
          <li><a href="/restaurante" onClick={() => setMenuOpen(false)}>Restaurante</a></li>
          <li><a href="/galeria" onClick={() => setMenuOpen(false)}>Galería</a></li>
          <li><a href="/experiencias" onClick={() => setMenuOpen(false)}>Experiencias</a></li>
          <li><a href="/#contacto" onClick={() => setMenuOpen(false)}>Contacto</a></li>
          <li>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mobileCta}
              onClick={() => setMenuOpen(false)}
            >
              Reservar Ahora
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
