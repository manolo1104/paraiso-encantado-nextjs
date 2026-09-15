'use client';

/**
 * Panel de Opinión — lo que contestan los huéspedes en /encuesta.
 *
 * El orden de la pantalla es deliberado: primero lo que exige que hagas algo hoy
 * (las calificaciones de 3 o menos, con teléfono para llamar), después la
 * tendencia por aspecto, y hasta abajo el histórico. Una hoja de cálculo tiene
 * los mismos datos y no sirve, porque no te dice qué mirar primero.
 */
import { useEffect, useState } from 'react';
import { Star, TrendingUp, TrendingDown, Minus, Phone, Mail, AlertTriangle, Loader2 } from 'lucide-react';

interface Respuesta {
  fecha: string; confirmacion: string; rating: number; comentario: string;
  limpieza: number | null; agua: number | null; descanso: number | null;
  desayuno: number | null; atencion: number | null; spa: number | null;
  llegada: string; tour: string; guia: number | null; nps: number | null;
  cliente?: string; telefono?: string; email?: string;
}
interface Aspecto { key: string; actual: number | null; previo: number | null; respuestas: number }
interface Data {
  respuestas: Respuesta[];
  resumen: null | {
    totalHistorico: number; total30d: number; total30dPrevio: number;
    promedioGeneral: number | null; promedioGeneralPrevio: number | null;
    guia: number | null; conTour: number; seLesDificultoLlegar: number; alertas: number;
  };
  aspectos: Aspecto[];
  nps: null | { actual: { valor: number | null; respuestas: number }; previo: { valor: number | null; respuestas: number } };
}

const ETIQUETAS: Record<string, string> = {
  limpieza: 'Limpieza de la suite',
  agua: 'Agua caliente y regadera',
  descanso: 'Descanso (cama y ruido)',
  desayuno: 'Desayuno',
  atencion: 'Atención del personal',
  spa: 'Piscina spa privada',
};

const F = 'var(--font-jost, sans-serif)';

function fmtFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Tendencia({ actual, previo }: { actual: number | null; previo: number | null }) {
  if (actual === null || previo === null) {
    return <span style={{ fontSize: 12, color: '#9ca3af' }}>sin comparativo</span>;
  }
  const dif = Math.round((actual - previo) * 10) / 10;
  if (Math.abs(dif) < 0.1) {
    return <span style={{ fontSize: 12, color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Minus size={12} /> igual</span>;
  }
  const sube = dif > 0;
  return (
    <span style={{ fontSize: 12, color: sube ? '#2d7a34' : '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {sube ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {sube ? '+' : ''}{dif} vs mes anterior
    </span>
  );
}

function Estrellas({ n }: { n: number }) {
  return (
    <span style={{ whiteSpace: 'nowrap', color: '#c9a96e', letterSpacing: 1 }} aria-label={`${n} de 5`}>
      {'★'.repeat(n)}<span style={{ color: '#e0dbd0' }}>{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '18px 20px',
};

export default function OpinionClient() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/opinion')
      .then(r => r.json())
      .then(d => (d.error ? setError(d.error) : setData(d)))
      .catch(() => setError('Error de red al cargar las opiniones'));
  }, []);

  if (error) {
    return <div style={{ ...card, color: '#8a1a1a', fontFamily: F }}>{error}</div>;
  }
  if (!data) {
    return (
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280', fontFamily: F }}>
        <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Cargando opiniones…
      </div>
    );
  }

  const { resumen, aspectos, nps, respuestas } = data;

  if (!resumen || resumen.totalHistorico === 0) {
    return (
      <div style={{ ...card, fontFamily: F, color: '#6b7280', lineHeight: 1.8 }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#1a1a1a' }}>Todavía no hay respuestas.</p>
        <p style={{ margin: '8px 0 0' }}>
          La encuesta se envía sola un día después de cada check-out. Las respuestas aparecen aquí
          en cuanto alguien conteste.
        </p>
      </div>
    );
  }

  const bajas = respuestas.filter(r => r.rating > 0 && r.rating <= 3);
  const conComentario = respuestas.filter(r => r.comentario.trim().length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <div style={card}>
          <p style={{ fontSize: 12, color: '#6b7280', fontFamily: F, margin: '0 0 6px' }}>Promedio (30 días)</p>
          <p style={{ fontSize: 30, fontWeight: 300, color: '#1a2e1a', margin: '0 0 4px', fontFamily: 'var(--font-cormorant), serif' }}>
            {resumen.promedioGeneral ?? '—'}<span style={{ fontSize: 15, color: '#9ca3af' }}> /5</span>
          </p>
          <Tendencia actual={resumen.promedioGeneral} previo={resumen.promedioGeneralPrevio} />
        </div>
        <div style={card}>
          <p style={{ fontSize: 12, color: '#6b7280', fontFamily: F, margin: '0 0 6px' }}>NPS (30 días)</p>
          <p style={{ fontSize: 30, fontWeight: 300, color: '#1a2e1a', margin: '0 0 4px', fontFamily: 'var(--font-cormorant), serif' }}>
            {nps?.actual.valor ?? '—'}
          </p>
          <Tendencia actual={nps?.actual.valor ?? null} previo={nps?.previo.valor ?? null} />
        </div>
        <div style={card}>
          <p style={{ fontSize: 12, color: '#6b7280', fontFamily: F, margin: '0 0 6px' }}>Respuestas (30 días)</p>
          <p style={{ fontSize: 30, fontWeight: 300, color: '#1a2e1a', margin: '0 0 4px', fontFamily: 'var(--font-cormorant), serif' }}>
            {resumen.total30d}
          </p>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F }}>{resumen.totalHistorico} en total</span>
        </div>
        <div style={{ ...card, borderColor: bajas.length > 0 ? '#f0c4c4' : '#eee' }}>
          <p style={{ fontSize: 12, color: '#6b7280', fontFamily: F, margin: '0 0 6px' }}>Requieren atención</p>
          <p style={{ fontSize: 30, fontWeight: 300, color: bajas.length > 0 ? '#b91c1c' : '#1a2e1a', margin: '0 0 4px', fontFamily: 'var(--font-cormorant), serif' }}>
            {bajas.length}
          </p>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F }}>3 estrellas o menos</span>
        </div>
      </div>

      {/* Lo que exige acción */}
      {bajas.length > 0 && (
        <section>
          <h2 style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle size={16} color="#b91c1c" /> Huéspedes que no la pasaron bien
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bajas.slice(0, 10).map((r, i) => (
              <div key={i} style={{ ...card, borderLeft: '3px solid #b91c1c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontFamily: F, fontSize: 14, color: '#1a1a1a' }}>{r.cliente || r.confirmacion}</strong>
                    <span style={{ fontFamily: F, fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>{fmtFecha(r.fecha)}</span>
                  </div>
                  <Estrellas n={r.rating} />
                </div>
                {r.comentario && (
                  <p style={{ fontFamily: F, fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '0 0 10px' }}>
                    “{r.comentario}”
                  </p>
                )}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: F, fontSize: 13 }}>
                  {r.telefono && (
                    <a href={`https://wa.me/${r.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2d7a34', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={13} /> {r.telefono}
                    </a>
                  )}
                  {r.email && (
                    <a href={`mailto:${r.email}`} style={{ color: '#2e6b8a', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Mail size={13} /> {r.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Aspectos */}
      <section>
        <h2 style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '0 0 12px' }}>
          Por aspecto · últimos 30 días
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {aspectos.map(a => (
            <div key={a.key} style={card}>
              <p style={{ fontFamily: F, fontSize: 13.5, color: '#374151', margin: '0 0 8px' }}>{ETIQUETAS[a.key] || a.key}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 300, color: a.actual !== null && a.actual < 4 ? '#b45309' : '#1a2e1a', fontFamily: 'var(--font-cormorant), serif' }}>
                  {a.actual ?? '—'}
                </span>
                <span style={{ fontSize: 13, color: '#9ca3af', fontFamily: F }}>/5 · {a.respuestas} resp.</span>
              </div>
              <Tendencia actual={a.actual} previo={a.previo} />
            </div>
          ))}
        </div>
        <p style={{ fontFamily: F, fontSize: 12.5, color: '#6b7280', marginTop: 12, lineHeight: 1.7 }}>
          {resumen.conTour > 0 && <>Tomaron tour {resumen.conTour} huésped{resumen.conTour !== 1 ? 'es' : ''} (guía: {resumen.guia ?? '—'}/5). </>}
          {resumen.seLesDificultoLlegar > 0 && <>A {resumen.seLesDificultoLlegar} le costó llegar al hotel.</>}
        </p>
      </section>

      {/* Comentarios */}
      {conComentario.length > 0 && (
        <section>
          <h2 style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '0 0 12px' }}>
            Lo que escribieron
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conComentario.slice(0, 30).map((r, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontFamily: F, fontSize: 13, color: '#6b7280' }}>
                    {r.cliente || r.confirmacion} · {fmtFecha(r.fecha)}
                  </span>
                  <Estrellas n={r.rating} />
                </div>
                <p style={{ fontFamily: F, fontSize: 14, color: '#374151', lineHeight: 1.75, margin: 0 }}>“{r.comentario}”</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
