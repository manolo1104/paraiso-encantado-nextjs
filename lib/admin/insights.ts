import type { AdminBooking } from './sheets-admin';
import { mexicoTodayStr, mexicoTodayParts } from '../date-mx';

const TOTAL_SUITES = 13;
const OTA_COMMISSION = 0.15; // 15% Booking.com / Airbnb

// Cuántas habitaciones ocupa una reserva. El campo `habitaciones` es un CSV
// ("Jungla (2 personas), Lirios 1 (2 personas)"); una reserva multi-cuarto
// contaba como 1 sola suite ocupada y desinflaba la ocupación.
function roomCount(b: AdminBooking): number {
  if (!b.habitaciones) return 1;
  const n = b.habitaciones.split(',').map(s => s.trim()).filter(Boolean).length;
  return n > 0 ? n : 1;
}

// Formatea el día-calendario de una fecha anclada a medianoche UTC (así se
// construyen `today` y los días del forecast). NO usar para "hoy" del reloj:
// para eso está mexicoTodayStr(), que sí respeta la zona del hotel.
function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function parseTotal(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function isActive(b: AdminBooking): boolean {
  return b.estado !== 'CANCELADA';
}

function bookingCoversDate(b: AdminBooking, date: Date): boolean {
  if (!b.checkin || !b.checkout || !isActive(b)) return false;
  const ci = new Date(b.checkin + 'T00:00:00');
  const co = new Date(b.checkout + 'T00:00:00');
  return ci <= date && date < co;
}

export interface TodayMovement {
  tipo: 'checkin' | 'checkout';
  cliente: string;
  habitaciones: string;
  huespedes: number;
  noches: number;
  total: number;
  confirmacion: string;
}

export interface DayForecast {
  fecha: string;
  label: string;
  ocupadas: number;
  porcentaje: number;
}

export interface OriginBreakdown {
  label: string;
  count: number;
  ingresos: number;
  color: string;
}

export interface AgentSummary {
  whatsapp: { conversacionesHoy: number; conversacionesMes: number };
  emails: { confirmacion: number; preestancia: number; postestancia: number };
  blogs: number;
}

export interface InsightsData {
  hoy: {
    fecha: string;
    suitesOcupadas: number;
    porcentajeOcupacion: number;
    movimientos: TodayMovement[];
  };
  mes: {
    ingresos: number;
    reservas: number;
    revpar: number;
    adr: number;
    ocupacion: number;
  };
  forecast7dias: DayForecast[];
  origen: OriginBreakdown[];
  ahorroOTAs: number;
  agentes: AgentSummary;
}

export function calcInsights(
  bookings: AdminBooking[],
  agentMetrics: { tipo: string; fecha: string }[]
): InsightsData {
  const todayStr = mexicoTodayStr(); // "hoy" en hora del hotel, no UTC
  const today = new Date(todayStr + 'T00:00:00');

  // ── HOY ─────────────────────────────────────────────────────────────
  const suitesOcupadasHoy = Math.min(
    TOTAL_SUITES,
    bookings.filter(b => bookingCoversDate(b, today)).reduce((s, b) => s + roomCount(b), 0)
  );
  const pctOcupacion = Math.round((suitesOcupadasHoy / TOTAL_SUITES) * 100);

  const checkins: TodayMovement[] = bookings
    .filter(b => b.checkin === todayStr && isActive(b))
    .map(b => ({
      tipo: 'checkin',
      cliente: b.cliente,
      habitaciones: b.habitaciones,
      huespedes: b.huespedes,
      noches: b.noches || calcNights(b),
      total: parseTotal(b.total),
      confirmacion: b.confirmacion,
    }));

  const checkouts: TodayMovement[] = bookings
    .filter(b => b.checkout === todayStr && isActive(b))
    .map(b => ({
      tipo: 'checkout',
      cliente: b.cliente,
      habitaciones: b.habitaciones,
      huespedes: b.huespedes,
      noches: b.noches || calcNights(b),
      total: parseTotal(b.total),
      confirmacion: b.confirmacion,
    }));

  // ── MES ACTUAL ───────────────────────────────────────────────────────
  const { year: mxYear, month: mxMonth } = mexicoTodayParts();
  const mesStart = new Date(mxYear, mxMonth, 1);
  const mesEnd = new Date(mxYear, mxMonth + 1, 1);
  const diasMes = new Date(mxYear, mxMonth + 1, 0).getDate();

  const bookingsMes = bookings.filter(b => {
    if (!b.checkin || !isActive(b)) return false;
    const ci = new Date(b.checkin + 'T00:00:00');
    return ci >= mesStart && ci < mesEnd;
  });

  const ingresosMes = bookingsMes.reduce((s, b) => s + parseTotal(b.total), 0);
  // Noches-cuarto: noches × cuartos (una reserva de 3 suites × 2 noches = 6).
  const nochesMes = bookingsMes.reduce((s, b) => s + (b.noches || calcNights(b)) * roomCount(b), 0);
  const nochesDisp = TOTAL_SUITES * diasMes;
  const ocupacionMes = nochesMes > 0 ? Math.round((nochesMes / nochesDisp) * 100) : 0;
  const adrMes = nochesMes > 0 ? Math.round(ingresosMes / nochesMes) : 0;
  const revparMes = Math.round((adrMes * ocupacionMes) / 100);

  // ── FORECAST 7 DÍAS ──────────────────────────────────────────────────
  const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const forecast7dias: DayForecast[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    const ocupadas = Math.min(
      TOTAL_SUITES,
      bookings.filter(b => bookingCoversDate(b, d)).reduce((s, b) => s + roomCount(b), 0)
    );
    return {
      fecha: toDateStr(d),
      label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS_ES[d.getDay()],
      ocupadas,
      porcentaje: Math.round((ocupadas / TOTAL_SUITES) * 100),
    };
  });

  // ── ORIGEN DE RESERVAS (mes actual) ──────────────────────────────────
  const origenMap: Record<string, { count: number; ingresos: number }> = {
    Web: { count: 0, ingresos: 0 },
    WhatsApp: { count: 0, ingresos: 0 },
    Manual: { count: 0, ingresos: 0 },
  };

  for (const b of bookingsMes) {
    const total = parseTotal(b.total);
    if (b.estado === 'MANUAL') {
      origenMap['Manual'].count++;
      origenMap['Manual'].ingresos += total;
    } else if (b.notas?.toLowerCase().includes('whatsapp') || b.comoNosConocio?.toLowerCase().includes('whatsapp')) {
      origenMap['WhatsApp'].count++;
      origenMap['WhatsApp'].ingresos += total;
    } else {
      origenMap['Web'].count++;
      origenMap['Web'].ingresos += total;
    }
  }

  const ORIGIN_COLORS: Record<string, string> = {
    Web: '#C9A97A',
    WhatsApp: '#4ade80',
    Manual: '#93c5fd',
  };

  const origen: OriginBreakdown[] = Object.entries(origenMap)
    .filter(([, v]) => v.count > 0)
    .map(([label, v]) => ({ label, ...v, color: ORIGIN_COLORS[label] }));

  // ── AHORRO OTAs (año corriente, reservas directas) ───────────────────
  const yearStart = new Date(mxYear, 0, 1);
  const bookingsYear = bookings.filter(b => {
    if (!b.checkin || !isActive(b)) return false;
    return new Date(b.checkin + 'T00:00:00') >= yearStart;
  });
  const ingresosYear = bookingsYear.reduce((s, b) => s + parseTotal(b.total), 0);
  const ahorroOTAs = Math.round(ingresosYear * OTA_COMMISSION);

  // ── MÉTRICAS AGENTES ─────────────────────────────────────────────────
  const mesMesStr = todayStr.substring(0, 7); // "2026-05"

  const waHoy = agentMetrics.filter(m => m.tipo === 'whatsapp_conv' && m.fecha === todayStr).length;
  const waMes = agentMetrics.filter(m => m.tipo === 'whatsapp_conv' && m.fecha.startsWith(mesMesStr)).length;
  const emailConf = agentMetrics.filter(m => m.tipo === 'email_confirmacion' && m.fecha.startsWith(mesMesStr)).length;
  const emailPre = agentMetrics.filter(m => m.tipo === 'email_preestancia' && m.fecha.startsWith(mesMesStr)).length;
  const emailPost = agentMetrics.filter(m => m.tipo === 'email_postestancia' && m.fecha.startsWith(mesMesStr)).length;
  const blogs = agentMetrics.filter(m => m.tipo === 'blog_publicado' && m.fecha.startsWith(mesMesStr)).length;

  return {
    hoy: {
      fecha: todayStr,
      suitesOcupadas: suitesOcupadasHoy,
      porcentajeOcupacion: pctOcupacion,
      movimientos: [...checkins, ...checkouts],
    },
    mes: {
      ingresos: ingresosMes,
      reservas: bookingsMes.length,
      revpar: revparMes,
      adr: adrMes,
      ocupacion: ocupacionMes,
    },
    forecast7dias,
    origen,
    ahorroOTAs,
    agentes: {
      whatsapp: { conversacionesHoy: waHoy, conversacionesMes: waMes },
      emails: { confirmacion: emailConf, preestancia: emailPre, postestancia: emailPost },
      blogs,
    },
  };
}

function calcNights(b: AdminBooking): number {
  if (!b.checkin || !b.checkout) return 0;
  const diff = (new Date(b.checkout).getTime() - new Date(b.checkin).getTime()) / 86400000;
  return Math.max(0, Math.round(diff));
}
