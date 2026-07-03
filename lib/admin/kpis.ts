import type { AdminBooking } from './sheets-admin';
import { mexicoTodayStr, mexicoTodayParts } from '../date-mx';

const TOTAL_SUITES = 13;

// Normaliza el nombre de suite: quita el sufijo "(2 personas)" y espacios.
// Así "Jungla (2 personas)" y "Jungla (4 personas)" cuentan como la misma suite.
function normSuite(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

function roomsOf(b: AdminBooking): string[] {
  if (!b.habitaciones) return [];
  return b.habitaciones.split(',').map(normSuite).filter(Boolean);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function bookingInRange(b: AdminBooking, from: Date, to: Date): boolean {
  if (!b.checkin) return false;
  const ci = new Date(b.checkin + 'T00:00:00');
  return ci >= from && ci < to && b.estado !== 'CANCELADA';
}

function calcNightsForBooking(b: AdminBooking): number {
  if (b.noches > 0) return b.noches;
  if (b.checkin && b.checkout) {
    const diff = (new Date(b.checkout).getTime() - new Date(b.checkin).getTime()) / 86400000;
    return Math.max(0, Math.round(diff));
  }
  return 0;
}

// Noches-cuarto: noches × número de habitaciones de la reserva (para ocupación/ADR).
function roomNightsForBooking(b: AdminBooking): number {
  const rooms = Math.max(1, roomsOf(b).length);
  return calcNightsForBooking(b) * rooms;
}

export function calcKPIs(bookings: AdminBooking[]) {
  // "Ahora" anclado al día-calendario de México (antes UTC → semana/mes se
  // corrían de día la noche del último día del mes en hora del hotel).
  const { year: mxY, month: mxM, day: mxD } = mexicoTodayParts();
  const now = new Date(mxY, mxM, mxD);
  const todayStr = mexicoTodayStr();

  // Semana actual
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Mes actual
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diasMes = daysInMonth(now.getFullYear(), now.getMonth());

  // Mes anterior
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  // Año actual
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

  const bookingsWeek = bookings.filter(b => bookingInRange(b, weekStart, weekEnd));
  const bookingsMes = bookings.filter(b => bookingInRange(b, monthStart, monthEnd));
  const bookingsPrevMes = bookings.filter(b => bookingInRange(b, prevMonthStart, prevMonthEnd));
  const bookingsYear = bookings.filter(b => bookingInRange(b, yearStart, yearEnd));

  const ingresosWeek = bookingsWeek.reduce((s, b) => s + b.total, 0);
  const ingresosMes = bookingsMes.reduce((s, b) => s + b.total, 0);
  const ingresosPrevMes = bookingsPrevMes.reduce((s, b) => s + b.total, 0);
  const ingresosYear = bookingsYear.reduce((s, b) => s + b.total, 0);

  const nochesMes = bookingsMes.reduce((s, b) => s + roomNightsForBooking(b), 0);
  const nochesPrevMes = bookingsPrevMes.reduce((s, b) => s + roomNightsForBooking(b), 0);
  const nochesDisponiblesMes = TOTAL_SUITES * diasMes;

  const ocupacionMes = nochesMes > 0 ? Math.round((nochesMes / nochesDisponiblesMes) * 100) : 0;
  const ocupacionPrevMes = nochesPrevMes > 0 ? Math.round((nochesPrevMes / (TOTAL_SUITES * daysInMonth(prevMonthStart.getFullYear(), prevMonthStart.getMonth()))) * 100) : 0;

  const adrMes = nochesMes > 0 ? Math.round(ingresosMes / nochesMes) : 0;
  const revparMes = Math.round((adrMes * ocupacionMes) / 100);

  // Ingresos por mes (últimos 12)
  const porMes: { mes: string; ingresos: number; reservas: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const mBooks = bookings.filter(b => bookingInRange(b, mStart, mEnd));
    porMes.push({
      mes: mStart.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      ingresos: mBooks.reduce((s, b) => s + b.total, 0),
      reservas: mBooks.length,
    });
  }

  // Suites más vendidas — por suite individual normalizada, repartiendo las
  // noches/ingresos de la reserva entre sus cuartos (antes agrupaba por el CSV
  // crudo: "Jungla (2p)" y "Jungla, Lirios 1" salían como suites distintas).
  const suitesMap = new Map<string, { noches: number; ingresos: number }>();
  for (const b of bookingsYear) {
    const rooms = roomsOf(b);
    const list = rooms.length > 0 ? rooms : ['Sin asignar'];
    const nights = calcNightsForBooking(b);
    const ingresoPorCuarto = b.total / list.length;
    for (const suite of list) {
      const prev = suitesMap.get(suite) || { noches: 0, ingresos: 0 };
      suitesMap.set(suite, {
        noches: prev.noches + nights,
        ingresos: prev.ingresos + ingresoPorCuarto,
      });
    }
  }
  const suitesMasVendidas = Array.from(suitesMap.entries())
    .map(([suite, data]) => ({ suite, ...data }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 8);

  // Delta mes vs mes anterior
  const deltaIngresos = ingresosPrevMes > 0
    ? Math.round(((ingresosMes - ingresosPrevMes) / ingresosPrevMes) * 100)
    : 0;
  const deltaOcupacion = ocupacionPrevMes > 0
    ? ocupacionMes - ocupacionPrevMes
    : 0;

  return {
    semana: {
      ingresos: ingresosWeek,
      reservas: bookingsWeek.length,
    },
    mes: {
      ingresos: ingresosMes,
      reservas: bookingsMes.length,
      ocupacion: ocupacionMes,
      adr: adrMes,
      revpar: revparMes,
      deltaIngresos,
      deltaOcupacion,
    },
    año: {
      ingresos: ingresosYear,
      reservas: bookingsYear.length,
    },
    porMes,
    suitesMasVendidas,
  };
}
