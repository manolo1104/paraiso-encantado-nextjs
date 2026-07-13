/**
 * notas.ts
 * Parser/serializador central del campo "notas" de cotizaciones y reservas.
 *
 * Formato guardado en una sola celda de Sheets:
 *   {nota cliente}||INTERNO||{nota interna}||TOURS||{json}||PAQUETES||{json}||HABS||{json}
 * Todas las secciones son opcionales excepto que la nota del cliente es todo lo
 * que va ANTES del primer marcador.
 *
 * Antes cada lugar parseaba a mano y con bugs: cortaban en un marcador pero no
 * en el siguiente, así que (a) la nota interna y los JSON técnicos se colaban al
 * email/PDF del cliente, y (b) al editar, los tours/habitaciones se corrompían o
 * se perdían. Este módulo es la única fuente de verdad.
 */

export interface QuoteTour { nombre?: string; precio?: number; personas?: number; [k: string]: unknown }
export interface QuoteHab { suite?: string; personas?: number; precio?: number; noches?: number; [k: string]: unknown }

// Add-ons de servicio con precio unitario (desayuno por persona/noche, late
// check-out por habitación/noche). total del renglón = cantidad × precioUnit.
export interface ExtraItem {
  tipo: 'desayuno' | 'late_checkout';
  nombre: string;
  cantidad: number;     // person-noches (desayuno) o habitación-noches (late check-out)
  precioUnit: number;   // MXN por unidad
  detalle?: string;     // etiqueta legible p.ej. "2 personas × 3 noches"
}

export interface ParsedNotas {
  cliente: string;
  interno: string;
  tours: QuoteTour[];
  paquetes: QuoteTour[];
  habs: QuoteHab[];
  extras: ExtraItem[];
}

const INTERNO = '||INTERNO||';
const TOURS = '||TOURS||';
const PAQUETES = '||PAQUETES||';
const HABS = '||HABS||';
const EXTRAS = '||EXTRAS||';

// Orden en que aparecen los marcadores dentro de la cadena.
const MARKERS = [INTERNO, TOURS, PAQUETES, HABS, EXTRAS];

/** Devuelve el texto entre `marker` y el siguiente marcador (cualquiera). */
function sectionAfter(raw: string, marker: string): string | null {
  const idx = raw.indexOf(marker);
  if (idx < 0) return null;
  const start = idx + marker.length;
  let end = raw.length;
  for (const m of MARKERS) {
    const mi = raw.indexOf(m, start);
    if (mi >= 0 && mi < end) end = mi;
  }
  return raw.slice(start, end);
}

function safeJson<T>(text: string | null): T[] {
  if (!text) return [];
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function parseNotas(raw: string | null | undefined): ParsedNotas {
  const s = String(raw || '');
  // La nota del cliente es todo lo anterior al primer marcador presente.
  let firstIdx = s.length;
  for (const m of MARKERS) {
    const i = s.indexOf(m);
    if (i >= 0 && i < firstIdx) firstIdx = i;
  }
  return {
    cliente: s.slice(0, firstIdx).trim(),
    interno: (sectionAfter(s, INTERNO) || '').trim(),
    tours: safeJson<QuoteTour>(sectionAfter(s, TOURS)),
    paquetes: safeJson<QuoteTour>(sectionAfter(s, PAQUETES)),
    habs: safeJson<QuoteHab>(sectionAfter(s, HABS)),
    extras: safeJson<ExtraItem>(sectionAfter(s, EXTRAS)),
  };
}

/** Solo la nota que puede ver el cliente (email/PDF). Nunca incluye lo interno. */
export function clienteNota(raw: string | null | undefined): string {
  return parseNotas(raw).cliente;
}

export function joinNotas(p: Partial<ParsedNotas>): string {
  // Quitar cualquier marcador que el usuario haya tecleado dentro de los textos,
  // para no romper el parseo al releer.
  const strip = (t: string) => MARKERS.reduce((acc, m) => acc.split(m).join(' '), t || '').trim();
  let base = strip(p.cliente || '');
  const interno = strip(p.interno || '');
  if (interno) base += `${INTERNO}${interno}`;
  if (p.tours && p.tours.length > 0) base += `${TOURS}${JSON.stringify(p.tours)}`;
  if (p.paquetes && p.paquetes.length > 0) base += `${PAQUETES}${JSON.stringify(p.paquetes)}`;
  if (p.habs && p.habs.length > 0) base += `${HABS}${JSON.stringify(p.habs)}`;
  if (p.extras && p.extras.length > 0) base += `${EXTRAS}${JSON.stringify(p.extras)}`;
  return base;
}
