'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bed, Sofa, ShowerHead, Bath, Droplets, Mountain, Wifi,
  Wind, Trees, Waves, CheckCircle, MessageCircle
} from 'lucide-react';
import type { Suite } from '@/data/suites';
import StickySuiteCTA from '@/components/StickySuiteCTA';
import { mxnToUsd, BOOKING_URL } from '@/lib/config';
import { suites } from '@/data/suites';
import styles from './suite.module.css';

function getFeatureIcon(feature: string) {
  const f = feature.toLowerCase();
  if (f.includes('cama') || f.includes('king') || f.includes('matrimon'))
    return <Bed size={16} strokeWidth={1.5} />;
  if (f.includes('sala') || f.includes('sofa') || f.includes('sofá'))
    return <Sofa size={16} strokeWidth={1.5} />;
  if (f.includes('regadera') || f.includes('ducha'))
    return <ShowerHead size={16} strokeWidth={1.5} />;
  if (f.includes('tina') || f.includes('hidromasaje') || f.includes('baño'))
    return <Bath size={16} strokeWidth={1.5} />;
  if (f.includes('piscina') || f.includes('spa'))
    return <Droplets size={16} strokeWidth={1.5} />;
  if (f.includes('vista') || f.includes('montaña') || f.includes('panorámic'))
    return <Mountain size={16} strokeWidth={1.5} />;
  if (f.includes('wifi') || f.includes('internet'))
    return <Wifi size={16} strokeWidth={1.5} />;
  if (f.includes('aire') || f.includes('a/c') || f.includes('clima'))
    return <Wind size={16} strokeWidth={1.5} />;
  if (f.includes('jardín') || f.includes('terraza') || f.includes('balcón') || f.includes('planta'))
    return <Trees size={16} strokeWidth={1.5} />;
  if (f.includes('piscina') || f.includes('alberca') || f.includes('acceso directo'))
    return <Waves size={16} strokeWidth={1.5} />;
  return <CheckCircle size={16} strokeWidth={1.5} />;
}

interface Props {
  suite: Suite;
}

export default function SuitePageClient({ suite }: Props) {
  const [activeImg, setActiveImg] = useState(0);

  const price3 = suite.priceTiers[3];
  const price4 = suite.priceTiers[4];
  const usdBase = mxnToUsd(suite.price);

  return (
    <main className={styles.main}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/habitaciones">Habitaciones</Link>
        <span aria-hidden="true"> / </span>
        <span>{suite.name}</span>
      </nav>

      <div className={styles.layout}>
        {/* ---- GALERÍA ---- */}
        <section className={styles.gallerySection} aria-label="Galería de fotos">
          <div className={styles.mainImage}>
            <Image
              src={suite.images[activeImg]}
              alt={`${suite.name} — foto ${activeImg + 1}`}
              fill
              priority={activeImg === 0}
              sizes="(max-width: 768px) 100vw, 60vw"
              className={styles.mainImg}
            />
            <div className={styles.categoryChip}>{suite.category}</div>
            {suite.images.length > 1 && (
              <div className={styles.imgCounter}>
                {activeImg + 1} / {suite.images.length}
              </div>
            )}
          </div>

          {suite.images.length > 1 && (
            <div className={styles.thumbnails} role="list" aria-label="Miniaturas">
              {suite.images.map((src, i) => (
                <button
                  key={i}
                  className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-pressed={i === activeImg}
                  role="listitem"
                >
                  <Image
                    src={src}
                    alt={`${suite.name} foto ${i + 1}`}
                    fill
                    sizes="120px"
                    className={styles.thumbImg}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ---- DETALLE ---- */}
        <aside className={styles.detail}>
          <p className={styles.eyebrow}>{suite.categoryGroup}</p>
          <h1 className={styles.name}>{suite.name}</h1>
          <p className={styles.description}>{suite.description}</p>

          {/* Precio */}
          <div className={styles.priceCard}>
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Desde</span>
              <span className={styles.priceAmount}>
                ${suite.price.toLocaleString('es-MX')}
              </span>
              <span className={styles.priceUnit}>MXN/noche</span>
            </div>
            <p className={styles.priceUsd}>~${usdBase} USD por noche</p>
            <div className={styles.priceTiers}>
              <span>2 personas: <strong>${suite.priceTiers[2].toLocaleString('es-MX')}</strong> <em>(~${mxnToUsd(suite.priceTiers[2])} USD)</em></span>
              {price3 && (
                <span>3 personas: <strong>${price3.toLocaleString('es-MX')}</strong> <em>(~${mxnToUsd(price3)} USD)</em></span>
              )}
              {price4 && price4 !== price3 && (
                <span>4 personas: <strong>${price4.toLocaleString('es-MX')}</strong> <em>(~${mxnToUsd(price4)} USD)</em></span>
              )}
              {price3 && price4 && price4 === price3 && (
                <span>3–4 personas: <strong>${price3.toLocaleString('es-MX')}</strong> <em>(~${mxnToUsd(price3)} USD)</em></span>
              )}
              {suite.maxOccupancy > 4 && (
                <span className={styles.extraPerson}>
                  Persona adicional: <strong>+$300 MXN</strong>
                </span>
              )}
            </div>
            <p className={styles.maxOcc}>
              Capacidad máxima: <strong>{suite.maxOccupancy} personas</strong>
            </p>
          </div>

          {/* CTA */}
          <a
            href={BOOKING_URL}
            className={styles.reserveBtn}
            aria-label={`Reservar ${suite.name}`}
          >
            Asegura Tu Escapada
          </a>
          <p className={styles.reserveNote}>
            Confirmación instantánea · Cancela hasta 48hrs antes
          </p>

          {/* Features */}
          <section className={styles.featuresSection}>
            <h2 className={styles.featuresTitle}>Características</h2>
            <ul className={styles.featuresList} role="list">
              {suite.features.map((f) => (
                <li key={f} className={styles.featureItem}>
                  <span className={styles.featureIcon} aria-hidden="true">
                    {getFeatureIcon(f)}
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className={styles.guarantees}>
            <span><CheckCircle size={13} strokeWidth={2} /> Reserva directa sin comisiones</span>
            <span><CheckCircle size={13} strokeWidth={2} /> Pago 100% seguro (Stripe)</span>
            <span><CheckCircle size={13} strokeWidth={2} /> Cancelación gratis 48hrs</span>
          </div>

          <a
            href="https://wa.me/524891007679"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappBtn}
          >
            <MessageCircle size={16} strokeWidth={1.5} />
            Preguntar por WhatsApp
          </a>
        </aside>
      </div>

      {/* Otras suites */}
      <section className={styles.otherSuites}>
        <h2>Otras <em>Suites</em></h2>
        <div className={styles.otherGrid}>
          {suites
            .filter((s) => s.id !== suite.id)
            .slice(0, 4)
            .map((s) => (
              <Link key={s.id} href={`/habitaciones/${s.id}`} className={styles.otherCard}>
                <div className={styles.otherImage}>
                  <Image
                    src={s.images[0]}
                    alt={s.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className={styles.otherImg}
                  />
                </div>
                <div className={styles.otherContent}>
                  <h3>{s.name}</h3>
                  <p>Desde ${s.price.toLocaleString('es-MX')} MXN <span className={styles.otherUsd}>(~${mxnToUsd(s.price)} USD)</span></p>
                </div>
              </Link>
            ))}
        </div>
        <div className={styles.allSuitesLink}>
          <Link href="/habitaciones">← Ver todas las suites</Link>
        </div>
      </section>
      <StickySuiteCTA suiteName={suite.name} suiteId={suite.id} price={suite.price} />
    </main>
  );
}
