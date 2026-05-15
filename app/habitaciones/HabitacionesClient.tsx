'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, MessageCircle, Phone, BarChart2, X as XIcon } from 'lucide-react';
import type { Suite } from '@/data/suites';
import { mxnToUsd, BOOKING_URL } from '@/lib/config';
import styles from './habitaciones.module.css';

const URGENCY_MESSAGES: Record<string, string> = {
  HIGH: '¡Muy solicitada!',
  MEDIUM: 'Pocas fechas libres',
};

interface Props {
  groups: Record<string, Suite[]>;
  unavailableNames?: string[];
  checkin?: string;
  checkout?: string;
  suiteLinkSuffix?: string; // e.g. "?checkin=X&checkout=Y&guests=2"
}

export default function HabitacionesClient({ groups, unavailableNames = [], checkin = '', checkout = '', suiteLinkSuffix = '' }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // máx 3
      return [...prev, id];
    });
  }, []);

  const clearAll = useCallback(() => setSelected([]), []);

  const goCompare = useCallback(() => {
    if (selected.length >= 2) {
      router.push(`/comparar?ids=${selected.join(',')}`);
    }
  }, [selected, router]);

  return (
    <>
      {/* Suites por grupo */}
      {Object.entries(groups).map(([groupName, groupSuites]) => (
        <section key={groupName} className={styles.group}>
          <div className={styles.groupInner}>
            <h2 className={styles.groupTitle}>{groupName}</h2>
            <div className={styles.grid}>
              {groupSuites.map((suite) => {
                const isSelected = selected.includes(suite.id);
                const maxReached = selected.length >= 3 && !isSelected;
                const isUnavailable = unavailableNames.includes(suite.name);
                const occupancy = (suite as any).occupancy as string | undefined;
                const urgencyMsg = occupancy ? URGENCY_MESSAGES[occupancy] : undefined;

                // Build link with dates if available
                // suiteLinkSuffix includes ?checkin=X&checkout=Y&guests=N
                const href = `/habitaciones/${suite.id}${suiteLinkSuffix}`;

                return (
                  <div key={suite.id} className={`${styles.cardWrap} ${isSelected ? styles.cardWrapSelected : ''} ${isUnavailable ? styles.cardWrapUnavailable : ''}`}>
                    <Link href={href} className={styles.card}>
                      {/* Imagen */}
                      <div className={styles.imageWrapper}>
                        <Image
                          src={suite.images[0]}
                          alt={`${suite.name} — Paraíso Encantado`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className={styles.image}
                          loading="lazy"
                        />
                        <div className={styles.categoryBadge}>{suite.category}</div>
                        {suite.badge && !isUnavailable && (
                          <div className={styles.spaBadge}>{suite.badge}</div>
                        )}
                        {/* Availability overlay */}
                        {isUnavailable && (
                          <div className={styles.unavailableOverlay}>
                            <span>Ocupada</span>
                          </div>
                        )}
                        {!isUnavailable && urgencyMsg && !unavailableNames.length && (
                          <div className={styles.urgencyChip}>{urgencyMsg}</div>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className={styles.content}>
                        <div className={styles.contentTop}>
                          <h3 className={styles.name}>{suite.name}</h3>
                          <p className={styles.description}>{suite.description}</p>

                          <ul className={styles.amenities}>
                            {suite.amenities.map((a) => (
                              <li key={a} className={styles.amenityTag}>{a}</li>
                            ))}
                          </ul>

                          <p className={styles.occupancy}>
                            Hasta <strong>{suite.maxOccupancy} personas</strong>
                          </p>
                        </div>

                        <div className={styles.footer}>
                          <div className={styles.price}>
                            <span className={styles.priceLabel}>Desde</span>
                            <span className={styles.priceAmount}>
                              ${suite.price.toLocaleString('es-MX')}
                            </span>
                            <span className={styles.priceUnit}> MXN</span>
                            <span className={styles.priceUsd}>~${mxnToUsd(suite.price)} USD</span>
                          </div>
                          <span className={styles.reserveBtn}>Ver Suite →</span>
                        </div>
                      </div>
                    </Link>

                    {/* Botón comparar */}
                    <button
                      className={`${styles.compareToggle} ${isSelected ? styles.compareToggleActive : ''} ${maxReached ? styles.compareToggleDisabled : ''}`}
                      onClick={(e) => toggle(suite.id, e)}
                      aria-pressed={isSelected}
                      aria-label={isSelected ? `Quitar ${suite.name} de comparación` : `Agregar ${suite.name} a comparación`}
                      title={maxReached ? 'Máximo 3 suites' : isSelected ? 'Quitar de comparación' : 'Comparar esta suite'}
                      disabled={maxReached}
                    >
                      {isSelected ? (
                        <><XIcon size={12} strokeWidth={2.5} /> Quitar</>
                      ) : (
                        <><BarChart2 size={12} strokeWidth={2} /> Comparar</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* CTA final */}
      <section className={styles.finalCta}>
        <h2>¿Lista tu <em>Escapada</em>?</h2>
        <p>Confirmación instantánea · Cancelación gratuita hasta 48hrs antes</p>
        <a href={BOOKING_URL} className={styles.finalCtaBtn}>Reservar Ahora</a>
        <div className={styles.contactRow}>
          <a href="https://wa.me/524891007679" target="_blank" rel="noopener noreferrer">
            <MessageCircle size={14} strokeWidth={1.5} /> WhatsApp
          </a>
          <a href="tel:+524891007679"><Phone size={14} strokeWidth={1.5} /> 489-100-7679</a>
        </div>
      </section>

      {/* ── Barra de comparación sticky ── */}
      {selected.length >= 1 && (
        <div className={styles.compareBar} role="region" aria-label="Comparador de suites">
          <div className={styles.compareBarInner}>
            <div className={styles.compareBarLeft}>
              <BarChart2 size={16} strokeWidth={1.5} />
              <span className={styles.compareBarCount}>
                {selected.length} {selected.length === 1 ? 'suite' : 'suites'} seleccionada{selected.length > 1 ? 's' : ''}
              </span>
              <span className={styles.compareBarHint}>
                {selected.length < 2 ? '— elige 1 más para comparar' : selected.length < 3 ? '— puedes agregar 1 más' : '— máximo alcanzado'}
              </span>
            </div>
            <div className={styles.compareBarActions}>
              <button className={styles.compareBarClear} onClick={clearAll} aria-label="Limpiar selección">
                <XIcon size={14} strokeWidth={2} /> Limpiar
              </button>
              <button
                className={styles.compareBarCta}
                onClick={goCompare}
                disabled={selected.length < 2}
                aria-label="Ver comparación"
              >
                Ver Comparación →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
