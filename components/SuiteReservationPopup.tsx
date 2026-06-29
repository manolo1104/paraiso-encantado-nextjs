'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

type Profile = { name: string; city: string; suite: string; when: string };

// 25 perfiles distintos. Se barajan al cargar la página (randomiza cada sesión).
const PROFILES: Profile[] = [
  { name: 'Mariana R.',   city: 'CDMX',              suite: 'Suite Jungla',       when: 'hace 2 horas' },
  { name: 'José Luis M.', city: 'Querétaro',         suite: 'Suite LindaVista',   when: 'hace 5 horas' },
  { name: 'Fernanda O.',  city: 'Monterrey',         suite: 'Flor de Lis 2',      when: 'ayer' },
  { name: 'Diego A.',     city: 'Guadalajara',       suite: 'Helechos 1',         when: 'hace 3 días' },
  { name: 'Valentina C.', city: 'Puebla',            suite: 'Lirios 1',           when: 'esta mañana' },
  { name: 'Andrés P.',    city: 'San Luis Potosí',   suite: 'Orquídeas Doble',    when: 'hace 1 hora' },
  { name: 'Camila S.',    city: 'León',              suite: 'Suite Lajas',        when: 'hace 6 horas' },
  { name: 'Roberto G.',   city: 'Mérida',            suite: 'Bromelias',          when: 'hace 2 días' },
  { name: 'Daniela V.',   city: 'Tampico',           suite: 'Helechos 2',         when: 'hace 4 horas' },
  { name: 'Emiliano T.',  city: 'Toluca',            suite: 'Flor de Lis 1',      when: 'ayer' },
  { name: 'Regina L.',    city: 'Aguascalientes',    suite: 'Orquídeas 2',        when: 'hace 8 horas' },
  { name: 'Sebastián H.', city: 'Morelia',           suite: 'Suite Jungla',       when: 'hace 3 horas' },
  { name: 'Ximena F.',    city: 'Pachuca',           suite: 'Lirios 2',           when: 'hace 2 días' },
  { name: 'Mauricio D.',  city: 'Veracruz',          suite: 'Suite LindaVista',   when: 'esta mañana' },
  { name: 'Alejandra B.', city: 'Cuernavaca',        suite: 'Orquídeas 3',        when: 'hace 7 horas' },
  { name: 'Pablo N.',     city: 'Saltillo',          suite: 'Suite Lajas',        when: 'hace 1 día' },
  { name: 'Renata Q.',    city: 'Cancún',            suite: 'Helechos 1',         when: 'hace 5 horas' },
  { name: 'Gerardo E.',   city: 'Xalapa',            suite: 'Flor de Lis 2',      when: 'hace 9 horas' },
  { name: 'Lucía M.',     city: 'Ciudad Valles',     suite: 'Bromelias',          when: 'hace 2 horas' },
  { name: 'Héctor J.',    city: 'Zapopan',           suite: 'Orquídeas Doble',    when: 'ayer' },
  { name: 'Paola C.',     city: 'Torreón',           suite: 'Lirios 1',           when: 'hace 4 horas' },
  { name: 'Iván R.',      city: 'Oaxaca',            suite: 'Suite Jungla',       when: 'hace 3 días' },
  { name: 'Natalia G.',   city: 'Naucalpan',         suite: 'Helechos 2',         when: 'hace 6 horas' },
  { name: 'Rodrigo S.',   city: 'Tlaxcala',          suite: 'Orquídeas 2',        when: 'esta mañana' },
  { name: 'Isabela V.',   city: 'Tijuana',           suite: 'Flor de Lis 1',      when: 'hace 10 horas' },
];

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const VISIBLE_MS = 5000;   // tiempo en pantalla
const GAP_MS = 6000;       // pausa entre uno y otro
const FIRST_MS = 3500;     // primer popup tras cargar

export default function SuiteReservationPopup() {
  const [order] = useState<Profile[]>(() => shuffle(PROFILES));
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<Profile | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    let hideTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;

    const showTimer = setTimeout(function show() {
      setCurrent(order[index % order.length]);
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
      nextTimer = setTimeout(() => setIndex((i) => i + 1), VISIBLE_MS + GAP_MS);
    }, index === 0 ? FIRST_MS : 0);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [index, order, dismissed]);

  if (!current || dismissed) return null;

  return (
    <>
      <style>{`
        .srp {
          position: fixed;
          left: 20px;
          bottom: 20px;
          z-index: 60;
          max-width: 320px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--cream, #faf8f5);
          border: 1px solid rgba(201, 169, 122, 0.45);
          border-radius: 10px;
          box-shadow: 0 12px 34px rgba(30, 48, 18, 0.16);
          padding: 12px 14px 12px 14px;
          font-family: var(--font-jost, sans-serif);
          color: var(--ink, #2a2218);
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .45s cubic-bezier(.16,1,.3,1), transform .45s cubic-bezier(.16,1,.3,1);
          pointer-events: auto;
        }
        .srp.is-on { opacity: 1; transform: translateY(0); }
        .srp-avatar {
          flex-shrink: 0;
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--moss, #2d4a1a), var(--jade, #4a6e2e));
          color: #fff;
          font-size: 0.92rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .srp-body { line-height: 1.35; }
        .srp-main { font-size: 0.82rem; }
        .srp-main strong { font-weight: 600; }
        .srp-sub { font-size: 0.7rem; color: var(--sage, #6b8e4e); margin-top: 2px; }
        .srp-sub .srp-check { color: var(--jade, #4a6e2e); font-weight: 700; }
        .srp-close {
          position: absolute;
          top: 6px; right: 8px;
          background: none; border: none; cursor: pointer;
          color: rgba(42,34,24,0.4);
          padding: 2px; line-height: 0;
        }
        .srp-close:hover { color: rgba(42,34,24,0.75); }
        @media (max-width: 520px) {
          .srp { left: 12px; right: 12px; bottom: 12px; max-width: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .srp { transition: opacity .2s ease; transform: none; }
          .srp.is-on { transform: none; }
        }
      `}</style>
      <div
        className={`srp${visible ? ' is-on' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <button className="srp-close" onClick={dismiss} aria-label="Cerrar aviso">
          <X size={14} strokeWidth={2} />
        </button>
        <span className="srp-avatar" aria-hidden="true">
          {current.name.charAt(0)}
        </span>
        <span className="srp-body">
          <span className="srp-main">
            <strong>{current.name}</strong> de {current.city} reservó{' '}
            <strong>{current.suite}</strong>
          </span>
          <span className="srp-sub">
            <span className="srp-check" aria-hidden="true">✓</span> Reserva verificada · {current.when}
          </span>
        </span>
      </div>
    </>
  );
}
