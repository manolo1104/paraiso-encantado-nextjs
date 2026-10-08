import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Botón «Analizar la demanda ahora» del panel.
 *
 * Llama al cron por dentro (127.0.0.1) con el CRON_SECRET para no duplicar la
 * lógica ni, sobre todo, mandar el secreto al navegador. Mismo truco que
 * lib/email-scheduler.ts.
 */
export async function POST() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Falta CRON_SECRET en el servidor.' }, { status: 500 });
  }
  try {
    const port = process.env.PORT || '3000';
    const res = await fetch(`http://127.0.0.1:${port}/api/cron/precios`, {
      headers: { authorization: `Bearer ${secret}` },
      // Sin timeout, un cuelgue de la llamada al modelo (el SDK reintenta dos
      // veces con 10 min cada una) dejaba esta petición abierta media hora.
      signal: AbortSignal.timeout(240_000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 409) {
      return NextResponse.json(
        { error: (body as any)?.error || 'Ya hay un análisis corriendo.' },
        { status: 409 },
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: (body as any)?.errorReglas || (body as any)?.error || 'El análisis falló.' },
        { status: 500 },
      );
    }
    return NextResponse.json(body);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudo lanzar el análisis.' }, { status: 500 });
  }
}
