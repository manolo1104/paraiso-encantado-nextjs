import { NextRequest, NextResponse } from 'next/server';
import { aplicarReglas } from '@/lib/admin/precios-motor';
import { analizarDemanda } from '@/lib/admin/precios-ia';
import { construirSenales, senalesParaReglas } from '@/lib/admin/demanda';
import { getUltimaCorrida, marcarCorrida } from '@/lib/admin/precios-sheets';
import { enviarResumenPrecios } from '@/lib/email-precios';
import { mexicoTodayStr } from '@/lib/date-mx';

export const dynamic = 'force-dynamic';

/**
 * Corrida diaria de precios dinámicos.
 *
 * Va en /api/cron/ (y no en /api/admin/) a propósito: ahí el middleware no exige
 * el JWT del panel, así que se autentica ella sola con CRON_SECRET, igual que
 * email-sequences. La dispara lib/precios-scheduler.ts dentro del proceso.
 *
 * Orden: primero las reglas (determinísticas, con las señales de demanda del
 * día) y luego la IA sobre ese resultado. Si la IA falla, las reglas ya quedaron
 * aplicadas: el hotel nunca se queda sin calendario por un error del modelo.
 *
 * `?auto=1` la marca como la corrida automática del día: solo entonces se
 * respeta (y se escribe) la marca `precios_ultima_corrida` de la hoja. El botón
 * «Analizar ahora» del panel llama sin ese parámetro, porque pedirlo a mano
 * tiene que funcionar siempre.
 */

/**
 * Candado de in-flight. Una corrida dura entre 30 s y un minuto largo (la
 * llamada al modelo), y antes nada impedía que el cron y un clic del panel
 * —o dos pestañas— entraran a la vez: dos llamadas facturadas y dos
 * reescrituras del calendario peleándose.
 */
let corriendo: Promise<unknown> | null = null;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (corriendo) {
    return NextResponse.json(
      { ok: false, enCurso: true, error: 'Ya hay un análisis corriendo. Espera a que termine.' },
      { status: 409 },
    );
  }

  const auto = req.nextUrl.searchParams.get('auto') === '1';
  const hoy = mexicoTodayStr();

  if (auto) {
    const ultima = await getUltimaCorrida();
    if (ultima === hoy) {
      console.log(`[cron/precios] ${hoy} ya se analizó hoy — se salta`);
      return NextResponse.json({ ok: true, fecha: hoy, saltada: true });
    }
  }

  const tarea = correr(hoy, auto);
  corriendo = tarea;
  try {
    const { salida, status } = await tarea;
    return NextResponse.json(salida, { status });
  } finally {
    corriendo = null;
  }
}

async function correr(hoy: string, auto: boolean): Promise<{ salida: Record<string, unknown>; status: number }> {
  const salida: Record<string, unknown> = { ok: true, fecha: hoy };

  try {
    const senales = await construirSenales(hoy, 120);
    const reglas = await aplicarReglas(senalesParaReglas(senales));
    salida.reglasCambiadas = reglas.cambiadas;
    salida.nochesConFactor = reglas.conFactor;
    salida.nochesRespetadas = reglas.respetadas;
  } catch (e: any) {
    console.error('[cron/precios] fallaron las reglas:', e?.message || e);
    salida.ok = false;
    salida.errorReglas = e?.message || 'error';
    // El correo sale igual: un día sin aviso es indistinguible de un día sin
    // cambios, y justo este es el día en que hay que enterarse.
    if (auto) await enviarResumenPrecios(e?.message || 'error al aplicar las reglas');
    return { salida, status: 500 };
  }

  try {
    const ia = await analizarDemanda();
    Object.assign(salida, ia);
  } catch (e: any) {
    console.error('[cron/precios] falló el análisis de la IA:', e?.message || e);
    salida.errorIA = e?.message || 'error';
  }

  // La marca se escribe aunque la IA haya fallado: las reglas sí quedaron
  // aplicadas, y lo que no se quiere es que un reinicio vuelva a pagar la
  // llamada al modelo el mismo día.
  if (auto) await marcarCorrida(hoy);

  // Resumen diario por correo. Solo en la corrida automática: mandarlo también
  // en cada clic de «Analizar ahora» llenaría el buzón de correos que él mismo
  // acaba de provocar y que ya está viendo en pantalla.
  // Va con `await`: un envío lanzado sin esperar se corta cuando el proceso
  // cierra la petición, y el correo no sale nunca.
  if (auto) await enviarResumenPrecios(salida.errorIA as string | undefined);

  console.log('[cron/precios]', JSON.stringify(salida));
  return { salida, status: 200 };
}
