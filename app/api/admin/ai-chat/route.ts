import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAllBookings, getAgentMetrics, getAllQuotes } from '@/lib/admin/sheets-admin';
import { calcInsights } from '@/lib/admin/insights';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages requerido' }, { status: 400 });
  }

  const [bookings, agentMetrics, quotes] = await Promise.all([
    getAllBookings(),
    getAgentMetrics(),
    getAllQuotes(),
  ]);

  const insights = calcInsights(bookings, agentMetrics);
  const now = new Date();

  const systemPrompt = `Eres el asistente de inteligencia del hotel Paraíso Encantado en Xilitla, San Luis Potosí.
Ayudas al dueño del hotel a entender los datos de su negocio en tiempo real. Responde siempre en español,
de forma concisa y orientada a acción. Cuando hay números, sé específico.

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

COTIZACIONES ACTIVAS: ${quotes.filter(q => q.estado === 'ENVIADA' || q.estado === 'BORRADOR').length} pendientes

TOTAL RESERVAS EN SISTEMA: ${bookings.length}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
