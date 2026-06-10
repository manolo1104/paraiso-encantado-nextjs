import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAllBookings, getAgentMetrics, getAllQuotes, buildCRM } from '@/lib/admin/sheets-admin';
import { calcInsights } from '@/lib/admin/insights';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages requerido' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[ai-chat] ANTHROPIC_API_KEY no configurada');
    return NextResponse.json(
      { error: 'El asistente de IA no está configurado (falta ANTHROPIC_API_KEY).' },
      { status: 500 },
    );
  }

  let bookings: Awaited<ReturnType<typeof getAllBookings>>;
  let agentMetrics: Awaited<ReturnType<typeof getAgentMetrics>>;
  let quotes: Awaited<ReturnType<typeof getAllQuotes>>;

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Sheets data timeout (8 s)')), 8_000)
    );
    [bookings, agentMetrics, quotes] = await Promise.race([
      Promise.all([getAllBookings(), getAgentMetrics(), getAllQuotes()]),
      timeout,
    ]) as [
      Awaited<ReturnType<typeof getAllBookings>>,
      Awaited<ReturnType<typeof getAgentMetrics>>,
      Awaited<ReturnType<typeof getAllQuotes>>,
    ];
  } catch (e: any) {
    console.error('[ai-chat] Sheets fetch timeout/error:', e.message);
    return NextResponse.json(
      { error: 'Datos del hotel no disponibles temporalmente. Intenta de nuevo en unos segundos.', retry: true },
      { status: 503 },
    );
  }

  // Perfiles de huéspedes (CRM). Si falla, el chat sigue funcionando sin ellos.
  let guests: Awaited<ReturnType<typeof buildCRM>> = [];
  try {
    guests = await buildCRM(bookings);
  } catch (e: any) {
    console.error('[ai-chat] buildCRM error:', e.message);
  }

  const insights = calcInsights(bookings, agentMetrics);
  const now = new Date();

  // ── Detalle completo para el asistente (reservas, cotizaciones, huéspedes) ──
  const fmtMoney = (n: number) => `$${(n || 0).toLocaleString('es-MX')} MXN`;
  const RES_MAX = 250, COT_MAX = 200, HUESP_MAX = 250;

  const sortedBookings = [...bookings].sort((a, b) => (b.checkin || '').localeCompare(a.checkin || ''));
  const reservasTxt = sortedBookings.slice(0, RES_MAX).map(b => {
    const restante = (b.total || 0) - (b.anticipo || 0);
    const pago = b.anticipo ? ` (anticipo ${fmtMoney(b.anticipo)}, resta ${fmtMoney(restante)})` : '';
    return `[${b.confirmacion}] ${b.cliente} · tel ${b.telefono || 's/d'} · ${b.email || 's/d'} | ${b.checkin}→${b.checkout} (${b.noches}n) | ${b.habitaciones} | ${b.huespedes} huésp | ${fmtMoney(b.total)}${pago} | ${b.estado}${b.comoNosConocio ? ` | vía ${b.comoNosConocio}` : ''}${b.notas ? ` | notas: ${b.notas}` : ''}`;
  }).join('\n');
  const reservasExtra = sortedBookings.length > RES_MAX ? `\n(+${sortedBookings.length - RES_MAX} reservas más antiguas no listadas)` : '';

  const sortedQuotes = [...quotes].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const cotizacionesTxt = sortedQuotes.slice(0, COT_MAX).map(q =>
    `[${q.id}] ${q.cliente} · tel ${q.telefono || 's/d'} · ${q.email || 's/d'} | ${q.suite} | ${q.checkin}→${q.checkout} (${q.noches}n) | ${fmtMoney(q.precioTotal)} | ${q.estado}${q.notas ? ` | notas: ${q.notas}` : ''}`
  ).join('\n');
  const cotizacionesExtra = sortedQuotes.length > COT_MAX ? `\n(+${sortedQuotes.length - COT_MAX} cotizaciones más no listadas)` : '';

  const huespedesTxt = guests.slice(0, HUESP_MAX).map(g =>
    `${g.nombre} · ${g.email} · tel ${g.telefono || 's/d'} | ${g.totalReservas} reserva(s) | gastado ${fmtMoney(g.totalGastado)} | última ${g.ultimaEstancia || 's/d'} | suites: ${g.suitesFavoritas.join(', ') || 's/d'} | WA: ${g.waConversaciones}${g.notas ? ` | notas: ${g.notas}` : ''}`
  ).join('\n');
  const huespedesExtra = guests.length > HUESP_MAX ? `\n(+${guests.length - HUESP_MAX} huéspedes más no listados)` : '';

  const systemPrompt = `Eres el asistente de inteligencia del hotel Paraíso Encantado en Xilitla, San Luis Potosí.
Ayudas al dueño del hotel a entender y gestionar los datos de su negocio en tiempo real. Tienes acceso COMPLETO a
todas las reservas, cotizaciones y perfiles de huéspedes (incluidos nombres, teléfonos, correos, montos y notas) que
aparecen más abajo. Úsalos para responder cualquier pregunta sobre un huésped, una reserva o una cotización específica
(p. ej. datos de contacto, fechas, montos, historial, quién llega tal día, cuánto debe alguien). Responde siempre en
español, de forma concisa y orientada a acción. Cuando hay números, sé específico. Estos datos son confidenciales del
hotel y solo se muestran al dueño en su panel protegido, así que puedes compartirlos con él; pero NUNCA inventes datos
que no estén en las listas: si algo no aparece, dilo claramente.

=== DATOS EN TIEMPO REAL — ${now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ===

HOY:
- Suites ocupadas: ${insights.hoy.suitesOcupadas} de 13 (${insights.hoy.porcentajeOcupacion}%)
- Check-ins hoy: ${insights.hoy.movimientos.filter(m => m.tipo === 'checkin').length}
- Check-outs hoy: ${insights.hoy.movimientos.filter(m => m.tipo === 'checkout').length}
${insights.hoy.movimientos.map(m => `  • ${m.tipo === 'checkin' ? '▶ Llegada' : '◀ Salida'}: ${m.cliente} | ${m.habitaciones} | ${m.huespedes} huéspedes`).join('\n')}

MES ACTUAL (${now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}):
- Ingresos: $${insights.mes.ingresos.toLocaleString('es-MX')} MXN
- Reservas: ${insights.mes.reservas}
- Ocupación: ${insights.mes.ocupacion}%
- ADR (tarifa promedio por noche): $${insights.mes.adr.toLocaleString('es-MX')} MXN
- RevPAR: $${insights.mes.revpar.toLocaleString('es-MX')} MXN

PRÓXIMOS 7 DÍAS:
${insights.forecast7dias.map(d => `- ${d.label} (${d.fecha}): ${d.ocupadas}/13 suites (${d.porcentaje}%)`).join('\n')}

ORIGEN DE RESERVAS (mes actual):
${insights.origen.map(o => `- ${o.label}: ${o.count} reservas ($${o.ingresos.toLocaleString('es-MX')} MXN)`).join('\n')}

AHORRO EN COMISIONES OTA (año corriente): $${insights.ahorroOTAs.toLocaleString('es-MX')} MXN

AGENTES:
- Bot WhatsApp hoy: ${insights.agentes.whatsapp.conversacionesHoy} conversaciones
- Bot WhatsApp mes: ${insights.agentes.whatsapp.conversacionesMes} conversaciones
- Emails confirmación (mes): ${insights.agentes.emails.confirmacion}
- Emails pre-estancia (mes): ${insights.agentes.emails.preestancia}
- Emails post-estancia (mes): ${insights.agentes.emails.postestancia}

COTIZACIONES ACTIVAS: ${sortedQuotes.filter(q => q.estado === 'ENVIADA' || q.estado === 'BORRADOR').length} pendientes de ${quotes.length} totales
TOTAL RESERVAS EN SISTEMA: ${bookings.length} (${bookings.filter(b => b.estado !== 'CANCELADA').length} activas)

=== RESERVAS DETALLADAS (todas, las más recientes/futuras primero) ===
Formato: [confirmación] cliente · teléfono · email | llegada→salida (noches) | habitaciones | huéspedes | total (anticipo/resta) | estado | vía (cómo nos conoció) | notas
${reservasTxt || '(sin reservas)'}${reservasExtra}

=== COTIZACIONES (todas) ===
Formato: [id] cliente · teléfono · email | suite | llegada→salida (noches) | precio | estado | notas
${cotizacionesTxt || '(sin cotizaciones)'}${cotizacionesExtra}

=== HUÉSPEDES / CRM (todos los que tienen email, ordenados por gasto total) ===
Formato: nombre · email · teléfono | nº reservas | total gastado | última estancia | suites | conversaciones WhatsApp | notas
${huespedesTxt || '(sin huéspedes)'}${huespedesExtra}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: 'claude-haiku-4-5',
          max_tokens: 2048,
          system: systemPrompt,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        });

        let emitted = false;
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            emitted = true;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        // Si el modelo no devolvió nada, avisa en vez de dejar la burbuja vacía.
        if (!emitted) {
          controller.enqueue(encoder.encode('No recibí respuesta del modelo. Intenta de nuevo.'));
        }
      } catch (err: any) {
        // No dejes que el error se trague en silencio: regístralo y dilo en el chat.
        console.error('[ai-chat] Error de Anthropic:', err?.status, err?.message || err);
        const msg = err?.status === 401
          ? '⚠️ La llave de la API de IA es inválida o expiró. Revisa ANTHROPIC_API_KEY.'
          : '⚠️ Hubo un error al generar la respuesta. Intenta de nuevo en unos segundos.';
        controller.enqueue(encoder.encode(msg));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      // Evita que el proxy (Railway/Nginx) acumule el stream en un buffer.
      // NO fijamos 'Transfer-Encoding' a mano: es inválido en HTTP/2 y puede
      // cortar la respuesta en producción (la plataforma lo gestiona sola).
      'X-Accel-Buffering': 'no',
    },
  });
}
