import { NextRequest, NextResponse } from 'next/server';
import { getAjustes, getConfigPrecios, getHistorial, getReglas, saveRegla, deleteRegla, setConfigPrecios } from '@/lib/admin/precios-sheets';
import { invalidarCachePrecios } from '@/lib/precios-vigentes';
import { TipoRegla } from '@/lib/precios';
import { mexicoTodayStr } from '@/lib/date-mx';
import { sumarDias } from '@/lib/precios';
import { construirSenales } from '@/lib/admin/demanda';

export const dynamic = 'force-dynamic';

// Panel de precios dinámicos. La autenticación la pone el middleware (/api/admin/*).

export async function GET() {
  try {
    const hoy = mexicoTodayStr();
    const [config, reglas, ajustes, historial, senales] = await Promise.all([
      getConfigPrecios(),
      getReglas(),
      getAjustes(hoy, sumarDias(hoy, 400)),
      getHistorial(60),
      construirSenales(hoy, 120).catch(() => []),
    ]);
    return NextResponse.json({ config, reglas, ajustes, historial, senales, hoy });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error al leer los precios' }, { status: 500 });
  }
}

const TIPOS: TipoRegla[] = ['temporada', 'finde', 'ocupacion', 'ultimahora'];

/** Alta o edición de una regla. */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const tipo = (TIPOS.includes(b?.tipo) ? b.tipo : 'temporada') as TipoRegla;
    const nombre = String(b?.nombre || '').trim().slice(0, 80);
    if (!nombre) return NextResponse.json({ error: 'Ponle un nombre a la regla' }, { status: 400 });

    const pctCrudo = Number(b?.pct);
    if (!Number.isFinite(pctCrudo) || pctCrudo === 0) {
      return NextResponse.json({ error: 'El porcentaje tiene que ser un número distinto de 0' }, { status: 400 });
    }
    // Tope del lado del servidor: el input del panel no tiene min/max y, aunque
    // lo tuviera, en un <input type=number> no bloquea lo que se escribe a mano.
    // Sin esto se guardaba un +9999% que la tabla mostraba tal cual y que solo
    // se recortaba al aplicar — o sea, el dueño leía un número que no era real.
    if (pctCrudo < -50 || pctCrudo > 100) {
      return NextResponse.json({ error: 'El porcentaje tiene que estar entre −50% y +100%' }, { status: 400 });
    }
    const pct = Math.round(pctCrudo * 10) / 10;
    const fecha = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : '');
    const desde = fecha(b?.desde);
    const hasta = fecha(b?.hasta);
    if (tipo === 'temporada') {
      if (!desde || !hasta) return NextResponse.json({ error: 'Una temporada necesita fecha de inicio y de fin' }, { status: 400 });
      if (hasta < desde) return NextResponse.json({ error: 'La fecha de fin es anterior a la de inicio' }, { status: 400 });
    }
    const dias = Array.isArray(b?.dias) ? b.dias.map(Number).filter((n: number) => n >= 0 && n <= 6) : [];
    if (tipo === 'finde' && dias.length === 0) {
      return NextResponse.json({ error: 'Elige al menos un día de la semana' }, { status: 400 });
    }

    // El umbral 0 no es un "sin configurar" inofensivo: una regla de ocupación
    // con umbral 0 cumple `ocupacionPct >= 0` SIEMPRE, o sea que mueve el precio
    // de las 365 noches del año sin que nada lo avise.
    const umbral = Math.round(Number(b?.umbral) || 0);
    if (tipo === 'ocupacion' && (umbral < 1 || umbral > 100)) {
      return NextResponse.json({ error: 'El % de ocupación tiene que estar entre 1 y 100' }, { status: 400 });
    }
    if (tipo === 'ultimahora' && (umbral < 1 || umbral > 60)) {
      return NextResponse.json({ error: 'Los días para la llegada tienen que estar entre 1 y 60' }, { status: 400 });
    }

    const prioridad = Math.min(99, Math.max(1, Math.round(Number(b?.prioridad) || 1)));

    const id = await saveRegla({
      id: b?.id ? String(b.id) : undefined,
      nombre, tipo, desde, hasta, dias,
      umbral,
      pct,
      prioridad,
      activa: b?.activa !== false,
    });
    invalidarCachePrecios();
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudo guardar la regla' }, { status: 500 });
  }
}

/** Interruptor maestro, piso, techo y banda de la IA. */
export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json();
    const cambios: Record<string, unknown> = {};
    if (typeof b?.activo === 'boolean') cambios.activo = b.activo;
    // Piso siempre negativo, techo siempre positivo: evita que un signo al revés
    // deje el techo por debajo del piso y todo el calendario en un valor absurdo.
    if (b?.pisoPct !== undefined) cambios.pisoPct = -Math.min(50, Math.abs(Number(b.pisoPct) || 0));
    if (b?.techoPct !== undefined) cambios.techoPct = Math.min(100, Math.abs(Number(b.techoPct) || 0));
    if (b?.bandaAutoPct !== undefined) cambios.bandaAutoPct = Math.min(50, Math.abs(Number(b.bandaAutoPct) || 0));
    await setConfigPrecios(cambios);
    invalidarCachePrecios();
    return NextResponse.json({ ok: true, config: await getConfigPrecios() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudo guardar' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 });
    await deleteRegla(id);
    invalidarCachePrecios();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudo borrar' }, { status: 500 });
  }
}
