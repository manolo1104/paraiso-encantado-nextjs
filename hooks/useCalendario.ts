'use client';
import { useCallback, useEffect, useState } from 'react';
import type { DatosCalendario } from '@/lib/calendario';

/**
 * Datos del calendario de estancia (/api/calendario), compartidos por todos los
 * buscadores de la página: una sola descarga aunque haya dos calendarios
 * montados (p. ej. la ficha de una suite y su barra fija). Caduca a los 2 min.
 */
export type EstadoCalendario = 'cargando' | 'ok' | 'sin-verificar' | 'error';

interface Respuesta {
  desde: string;
  libres: number[] | null;
  estado: 'ok' | 'sin-verificar';
  activo: boolean;
  factores: Record<string, number>;
}

const TTL_MS = 2 * 60_000;
let promesa: Promise<{ cal: DatosCalendario; estado: EstadoCalendario }> | null = null;
let cargadoEn = 0;
const oyentes = new Set<() => void>();

export function cargarCalendario(forzar = false): Promise<{ cal: DatosCalendario; estado: EstadoCalendario }> {
  if (!promesa || forzar || Date.now() - cargadoEn > TTL_MS) {
    cargadoEn = Date.now();
    promesa = fetch('/api/calendario', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Respuesta>;
      })
      .then((d) => ({
        cal: { desde: d.desde, libres: d.libres, factores: d.activo ? d.factores || {} : {} },
        estado: (d.estado === 'ok' ? 'ok' : 'sin-verificar') as EstadoCalendario,
      }))
      .catch(() => {
        // Sin red o sin servidor: el calendario sigue sirviendo para elegir
        // fechas (sin precios ni ocupación) y se reintenta en la próxima apertura.
        promesa = null;
        return { cal: { desde: '', libres: null, factores: {} }, estado: 'error' as EstadoCalendario };
      });
    if (forzar) promesa.then(() => oyentes.forEach((f) => f()));
  }
  return promesa;
}

export function useCalendario(activo = true) {
  const [cal, setCal] = useState<DatosCalendario | null>(null);
  const [estado, setEstado] = useState<EstadoCalendario>('cargando');

  const leer = useCallback((forzar = false) => {
    cargarCalendario(forzar).then((r) => { setCal(r.cal); setEstado(r.estado); });
  }, []);

  useEffect(() => {
    if (!activo) return;
    leer();
    const alRefrescar = () => leer();
    oyentes.add(alRefrescar);
    return () => { oyentes.delete(alRefrescar); };
  }, [activo, leer]);

  return { cal, estado, refrescar: () => leer(true) };
}
