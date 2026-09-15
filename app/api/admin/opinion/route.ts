import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/sheets';
import { getAllBookings } from '@/lib/admin/sheets-admin';

export const dynamic = 'force-dynamic';

const TAB = 'Feedback';
const ASPECTOS = ['limpieza', 'agua', 'descanso', 'desayuno', 'atencion', 'spa'] as const;
type Aspecto = typeof ASPECTOS[number];

export interface Respuesta {
  fecha: string;
  confirmacion: string;
  rating: number;
  comentario: string;
  limpieza: number | null;
  agua: number | null;
  descanso: number | null;
  desayuno: number | null;
  atencion: number | null;
  spa: number | null;
  llegada: string;
  tour: string;
  guia: number | null;
  nps: number | null;
  /** Datos del huésped, cruzados por folio con la hoja Reservas */
  cliente?: string;
  telefono?: string;
  email?: string;
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : null;
}

function promedio(vals: (number | null)[]): number | null {
  const ok = vals.filter((v): v is number => v !== null);
  if (ok.length === 0) return null;
  return Math.round((ok.reduce((a, b) => a + b, 0) / ok.length) * 10) / 10;
}

/**
 * NPS clásico: % promotores (9-10) − % detractores (0-6). Va de -100 a 100.
 * Se calcula aquí y no en el cliente para que la cifra sea una sola en todos lados.
 */
function calcNps(vals: (number | null)[]): { valor: number | null; respuestas: number } {
  const ok = vals.filter((v): v is number => v !== null);
  if (ok.length === 0) return { valor: null, respuestas: 0 };
  const prom = ok.filter(v => v >= 9).length;
  const det = ok.filter(v => v <= 6).length;
  return { valor: Math.round(((prom - det) / ok.length) * 100), respuestas: ok.length };
}

export async function GET() {
  const client = await getSheetsClient();
  if (!client || !process.env.GOOGLE_SHEET_ID) {
    return NextResponse.json({ error: 'Sin conexión a Sheets' }, { status: 500 });
  }

  let rows: string[][] = [];
  try {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${TAB}!A:O`,
    });
    rows = (res.data.values || []).slice(1) as string[][];
  } catch {
    // La pestaña no existe todavía: aún nadie ha contestado.
    return NextResponse.json({ respuestas: [], resumen: null, aspectos: [], nps: null });
  }

  // Cruce con Reservas para poder llamarle a quien calificó bajo. Best-effort:
  // si falla, la opinión se muestra igual, solo sin nombre ni teléfono.
  const porFolio = new Map<string, { cliente: string; telefono: string; email: string }>();
  try {
    for (const b of await getAllBookings()) {
      if (b.confirmacion) {
        porFolio.set(b.confirmacion.trim(), {
          cliente: b.cliente || '', telefono: b.telefono || '', email: b.email || '',
        });
      }
    }
  } catch { /* sin cruce */ }

  const respuestas: Respuesta[] = rows
    .filter(r => r[0])
    .map(r => {
      const folio = String(r[1] || '').trim();
      const extra = porFolio.get(folio);
      return {
        fecha: String(r[0] || ''),
        confirmacion: folio,
        rating: Number(r[2]) || 0,
        comentario: String(r[3] || ''),
        limpieza: num(r[5]), agua: num(r[6]), descanso: num(r[7]),
        desayuno: num(r[8]), atencion: num(r[9]), spa: num(r[10]),
        llegada: String(r[11] || ''), tour: String(r[12] || ''),
        guia: num(r[13]), nps: num(r[14]),
        ...(extra || {}),
      };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Una opinión por reserva, la más reciente. El correo viejo guardaba una fila
  // por CADA estrella que tocaba el huésped, así que el histórico trae a la misma
  // persona repetida hasta 8 veces con calificaciones distintas: sin esto, un
  // solo huésped inflaba los promedios y las alertas.
  const vistos = new Set<string>();
  const unicas = respuestas.filter(r => {
    if (!r.confirmacion || r.confirmacion === '(sin folio)') return true;
    if (vistos.has(r.confirmacion)) return false;
    vistos.add(r.confirmacion);
    return true;
  });

  // Ventanas de 30 días para poder comparar contra el periodo anterior: un
  // promedio suelto no dice nada, la tendencia sí.
  const ahora = Date.now();
  const dia = 86400000;
  const enVentana = (r: Respuesta, desde: number, hasta: number) => {
    const t = Date.parse(r.fecha);
    return !isNaN(t) && t >= ahora - desde * dia && t < ahora - hasta * dia;
  };
  const mes = unicas.filter(r => enVentana(r, 30, 0));
  const mesPrevio = unicas.filter(r => enVentana(r, 60, 30));

  const aspectos = ASPECTOS.map(key => ({
    key,
    actual: promedio(mes.map(r => r[key as Aspecto])),
    previo: promedio(mesPrevio.map(r => r[key as Aspecto])),
    respuestas: mes.filter(r => r[key as Aspecto] !== null).length,
  }));

  return NextResponse.json({
    respuestas: unicas.slice(0, 200),
    resumen: {
      totalHistorico: unicas.length,
      filasEnHoja: respuestas.length,
      total30d: mes.length,
      total30dPrevio: mesPrevio.length,
      promedioGeneral: promedio(mes.map(r => (r.rating > 0 ? r.rating : null))),
      promedioGeneralPrevio: promedio(mesPrevio.map(r => (r.rating > 0 ? r.rating : null))),
      guia: promedio(mes.map(r => r.guia)),
      conTour: mes.filter(r => r.tour === 'sí').length,
      seLesDificultoLlegar: mes.filter(r => r.llegada === 'Me perdí' || r.llegada === 'Un poco').length,
      alertas: unicas.filter(r => r.rating > 0 && r.rating <= 3).length,
    },
    aspectos,
    nps: { actual: calcNps(mes.map(r => r.nps)), previo: calcNps(mesPrevio.map(r => r.nps)) },
  });
}
