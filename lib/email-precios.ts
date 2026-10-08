/**
 * email-precios.ts
 * El resumen diario de precios dinámicos, por correo.
 *
 * Lo pidió Manolo el 8 oct 2026: después de la corrida de las 6:00 MX, un correo
 * con lo que la IA movió sola y lo que está esperando su visto bueno. Existe
 * porque las propuestas solo se veían entrando al panel: si no entraba, una
 * noche de Navidad podía quedarse semanas sin decidir.
 *
 * Dos decisiones de diseño que importan:
 *  - **El asunto lleva la señal**, no el relleno: «3 esperan tu visto bueno» vs
 *    «sin cambios». Un correo diario cuyo asunto siempre dice lo mismo se deja
 *    de leer a la semana.
 *  - Los precios van en la **suite de referencia** (Jungla / Flor de Liz a 2
 *    personas, $2,000) para que el número del correo sea idéntico al del panel.
 *    El factor es un %, así que las demás suites se mueven igual.
 */
import { Resend } from 'resend';
import { getAjustes, getHistorial, getReglas, getConfigPrecios } from '@/lib/admin/precios-sheets';
import { calcularImpacto, type ImpactoPrecios } from '@/lib/admin/precios-impacto';
import { factorPorReglas, redondear50, sumarDias, type AjusteDia } from '@/lib/precios';
import { BOOKING_ROOMS, getRoomBasePrice, formatMXN } from '@/lib/booking';
import { mexicoTodayStr, parseFechaHojaMx, toMexicoDateStr } from '@/lib/date-mx';

const FROM = process.env.RESEND_FROM || 'reservas@paraisoencantado.com';
const PANEL_URL = 'https://www.paraisoencantado.com/admin/precios';

/** Destinatarios. Se pueden cambiar sin desplegar con PRECIOS_EMAIL_TO (coma). */
const DESTINATARIOS = (process.env.PRECIOS_EMAIL_TO ||
  'daftpunkmanolo@gmail.com,marioarturocovarrubias@hotmail.com')
  .split(',').map(s => s.trim()).filter(Boolean);

const SUITE_REF = BOOKING_ROOMS.find(r => r.id === 4)!;
const PRECIO_REF = getRoomBasePrice(SUITE_REF, 2);

export interface NocheResumen {
  fecha: string;
  /** Lo que se cobra si la propuesta NO se aprueba: las reglas del dueño. */
  sinIA: number;
  /** Lo que se cobraría con la propuesta (o lo que ya se cobra, si se aplicó). */
  conIA: number;
  motivo: string;
}

export interface ResumenPrecios {
  fecha: string;
  activo: boolean;
  aplicadas: NocheResumen[];
  pendientes: NocheResumen[];
  impacto: ImpactoPrecios;
  /** Mensaje de error de la corrida, si lo hubo. */
  error?: string;
}

// ── Reunir los datos ──────────────────────────────────────

/** Construye el resumen leyendo el estado que dejó la corrida. */
export async function construirResumenPrecios(error?: string): Promise<ResumenPrecios> {
  const hoy = mexicoTodayStr();
  const [config, reglas, ajustes, historial, impacto] = await Promise.all([
    getConfigPrecios(),
    getReglas(),
    getAjustes(hoy, sumarDias(hoy, 400)),
    getHistorial(300),
    calcularImpacto(30),
  ]);

  const precioDeFactor = (f: number) => redondear50(PRECIO_REF * f);
  const sinIA = (fecha: string) => precioDeFactor(factorPorReglas(fecha, reglas, {}, config).factor);

  // Lo que se movió HOY: el historial es la única fuente que sabe qué cambió en
  // esta corrida y no en una anterior.
  const cambiadasHoy = new Set(
    historial
      .filter(h => {
        const cuando = parseFechaHojaMx(h.cuando);
        return cuando !== null && toMexicoDateStr(cuando) === hoy;
      })
      .map(h => h.fecha),
  );

  const resumenDe = (a: AjusteDia): NocheResumen => ({
    fecha: a.fecha,
    sinIA: sinIA(a.fecha),
    conIA: precioDeFactor(a.factor),
    motivo: a.motivo,
  });

  const aplicadas = ajustes
    .filter(a => a.origen === 'ia' && a.estado === 'aplicado' && cambiadasHoy.has(a.fecha))
    .sort((x, y) => x.fecha.localeCompare(y.fecha))
    .map(resumenDe);

  const pendientes = ajustes
    .filter(a => a.estado === 'propuesto')
    .sort((x, y) => x.fecha.localeCompare(y.fecha))
    .map(resumenDe);

  return { fecha: hoy, activo: config.activo, aplicadas, pendientes, impacto, error };
}

// ── El asunto ─────────────────────────────────────────────

export function asuntoResumen(r: ResumenPrecios): string {
  const dia = new Date(`${r.fecha}T12:00:00`)
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  if (r.error) return `Precios ${dia} · ⚠️ la revisión falló`;
  if (!r.activo) return `Precios ${dia} · apagados (no se cobra nada distinto)`;
  if (r.pendientes.length > 0) {
    return `Precios ${dia} · ${r.pendientes.length} ${r.pendientes.length === 1 ? 'noche espera' : 'noches esperan'} tu visto bueno`;
  }
  if (r.aplicadas.length > 0) {
    return `Precios ${dia} · ${r.aplicadas.length} ${r.aplicadas.length === 1 ? 'noche ajustada' : 'noches ajustadas'} sola`;
  }
  return `Precios ${dia} · sin cambios`;
}

// ── El HTML ───────────────────────────────────────────────

function fechaLarga(f: string): string {
  const d = new Date(`${f}T12:00:00`);
  const s = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function diferencia(n: NocheResumen): string {
  const d = n.conIA - n.sinIA;
  if (d === 0) return '<span style="color:#7a6a52;">igual</span>';
  const color = d > 0 ? '#1e6f4a' : '#a4701f';
  return `<span style="color:${color};font-weight:500;">${d > 0 ? '+' : '−'}${formatMXN(Math.abs(d))}</span>`;
}

/**
 * Cuatro columnas y no cinco a propósito: un correo se lee en el teléfono, y
 * ahí una tabla de cinco columnas se encoge hasta no leerse. El «de → a» va
 * junto en una celda.
 */
function tabla(titulo: string, nota: string, filas: NocheResumen[], mostrarSinIA: boolean): string {
  if (filas.length === 0) return '';
  const th = "padding:8px 10px;font-weight:400;font-size:11px;letter-spacing:1px;text-transform:uppercase;";
  return `
  <tr><td class="mp" style="padding:4px 40px 0;">
    <p style="margin:26px 0 2px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#2a2218;">${titulo}</p>
    <p style="margin:0 0 12px;font-family:'Jost',Arial,sans-serif;font-size:12.5px;font-weight:300;color:#7a6a52;line-height:1.6;">${nota}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family:'Jost',Arial,sans-serif;font-size:13px;">
      <tr style="background-color:#2f281f;color:#fff;">
        <th align="left" style="${th}">Noche</th>
        <th align="left" style="${th}">${mostrarSinIA ? 'Hoy → si apruebas' : 'Precio'}</th>
        <th align="left" style="${th}">Cambio</th>
        <th align="left" style="${th}">Por qué</th>
      </tr>
      ${filas.map((n, i) => `
      <tr style="background-color:${i % 2 ? '#f6f2ec' : '#faf8f5'};">
        <td style="padding:9px 10px;color:#2a2218;white-space:nowrap;">${fechaLarga(n.fecha)}</td>
        <td style="padding:9px 10px;color:#2a2218;white-space:nowrap;">
          ${mostrarSinIA ? `<span style="color:#9a8d79;">${formatMXN(n.sinIA)}</span> → ` : ''}<strong style="font-weight:500;">${formatMXN(n.conIA)}</strong>
        </td>
        <td style="padding:9px 10px;white-space:nowrap;">${diferencia(n)}</td>
        <td style="padding:9px 10px;color:#5c5243;font-weight:300;">${n.motivo}</td>
      </tr>`).join('')}
    </table>
  </td></tr>`;
}

export function buildPreciosEmailHtml(r: ResumenPrecios): string {
  const nada = r.aplicadas.length === 0 && r.pendientes.length === 0;
  const imp = r.impacto;

  const cuerpo = r.error
    ? `<tr><td class="mp" style="padding:28px 40px 0;">
         <div style="background-color:#fdf0ea;border-left:3px solid #a4701f;padding:16px 18px;">
           <p style="margin:0;font-family:'Jost',Arial,sans-serif;font-size:14px;color:#2a2218;line-height:1.7;">
             <strong>La revisión de hoy falló.</strong> Los precios se quedaron como estaban ayer —
             nadie va a pagar algo raro—, pero hoy nadie revisó la demanda.<br>
             <span style="font-size:12.5px;color:#7a6a52;">Detalle: ${r.error}</span>
           </p>
         </div>
       </td></tr>`
    : !r.activo
      ? `<tr><td class="mp" style="padding:28px 40px 0;">
           <p style="margin:0;font-family:'Jost',Arial,sans-serif;font-size:14px;color:#2a2218;line-height:1.7;">
             Los precios dinámicos están <strong>apagados</strong>: la web cobra el precio de lista.
             La revisión igual corrió, pero nada de lo que diga se está cobrando.
           </p>
         </td></tr>`
      : nada
        ? `<tr><td class="mp" style="padding:28px 40px 0;">
             <p style="margin:0;font-family:'Jost',Arial,sans-serif;font-size:14px;color:#2a2218;line-height:1.7;">
               Hoy no cambió ningún precio y no hay nada esperando tu decisión.
               Que no se mueva es buena señal: quiere decir que la demanda viene como se esperaba.
             </p>
           </td></tr>`
        : '';

  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${asuntoResumen(r)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400;500&display=swap');
  *{margin:0;padding:0;}
  body{font-family:'Jost','Helvetica Neue',Arial,sans-serif;background-color:#f0ebe3;line-height:1.6;}
  table{border-collapse:collapse;}
  @media only screen and (max-width:640px){
    .container{width:100%!important;max-width:100%!important;}
    .mp{padding-left:22px!important;padding-right:22px!important;}
    .mplg{padding:28px 22px!important;}
  }
</style></head>
<body bgcolor="#f0ebe3" style="background-color:#f0ebe3;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0ebe3" style="background-color:#f0ebe3;padding:20px 0;">
<tr><td align="center">
<table role="presentation" class="container" width="660" cellspacing="0" cellpadding="0" border="0" bgcolor="#faf8f5" style="max-width:660px;background-color:#faf8f5;">

  <tr><td class="mplg" style="padding:32px 40px 30px;background-color:#2f281f;" bgcolor="#2f281f">
    <p style="margin:0 0 8px;font-family:'Jost',Arial,sans-serif;font-size:11px;letter-spacing:3.5px;text-transform:uppercase;color:rgba(255,255,255,0.72);">Paraíso Encantado · precios</p>
    <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-style:italic;font-weight:300;color:#ffffff;line-height:1.15;">Revisión del ${fechaLarga(r.fecha)}</h1>
  </td></tr>

  ${cuerpo}

  ${tabla(
    'Ya lo cambié solo',
    'Cambios chicos, dentro del margen que autorizaste. Ya se están cobrando; si alguno no te cuadra, en el panel lo puedes fijar a mano.',
    r.aplicadas, false,
  )}

  ${tabla(
    'Esperan tu visto bueno',
    'Cambios grandes: no se cobran hasta que los apruebes. El primer número es lo que esa noche cobra HOY con tu propia regla de temporada — no el precio de lista —, así que es contra eso que conviene comparar.',
    r.pendientes, true,
  )}

  ${r.pendientes.length > 0 ? `
  <tr><td class="mp" align="center" style="padding:26px 40px 4px;">
    <a href="${PANEL_URL}" style="display:inline-block;background-color:#2f281f;color:#ffffff;text-decoration:none;font-family:'Jost',Arial,sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:14px 34px;">Revisarlas en el panel</a>
  </td></tr>` : ''}

  <tr><td class="mp" style="padding:26px 40px 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0ebe3;">
      <tr><td style="padding:16px 20px;font-family:'Jost',Arial,sans-serif;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7a6a52;">Últimos 30 días</p>
        ${imp.reservas === 0
          ? `<p style="margin:0;font-size:13px;font-weight:300;color:#5c5243;line-height:1.65;">Todavía no hay ninguna reserva con precio dinámico, así que no se puede medir nada.${imp.sinDato > 0 ? ` (${imp.sinDato} ${imp.sinDato === 1 ? 'reserva' : 'reservas'} del periodo son anteriores a esta medición o se capturaron a mano.)` : ''}</p>`
          : `<p style="margin:0 0 2px;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;color:${imp.diferencia >= 0 ? '#1e6f4a' : '#a4701f'};line-height:1.1;">${imp.diferencia >= 0 ? '+' : '−'}${formatMXN(Math.abs(imp.diferencia))}</p>
             <p style="margin:0;font-size:13px;font-weight:300;color:#5c5243;line-height:1.65;">Eso cobraste de ${imp.diferencia >= 0 ? 'más' : 'menos'} que con el precio de lista, en ${imp.reservas} ${imp.reservas === 1 ? 'reserva' : 'reservas'} del motor web.</p>`}
      </td></tr>
    </table>
  </td></tr>

  <tr><td class="mp" style="padding:22px 40px 34px;">
    <p style="margin:0;font-family:'Jost',Arial,sans-serif;font-size:11.5px;font-weight:300;color:#9a8d79;line-height:1.7;">
      Precios de la suite Jungla a 2 personas (base ${formatMXN(PRECIO_REF)}), los mismos que ves en el panel.
      El ajuste es un porcentaje, así que las demás suites se mueven igual.<br>
      Esto solo afecta al motor de reservas de la web: tus cotizaciones del panel y el bot de WhatsApp siguen con el precio base.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ── El envío ──────────────────────────────────────────────

/**
 * Manda el resumen. Nunca lanza: que falle el correo no puede tumbar la corrida
 * de precios, que es lo que de verdad importa.
 *
 * 🔴 Resend v4 NO lanza excepción cuando el envío falla: devuelve `{ data, error }`.
 * Sin revisar `error`, un correo que nunca salió se vería como un envío exitoso.
 */
export async function enviarResumenPrecios(error?: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[precios-email] sin RESEND_API_KEY — no se manda el resumen');
    return;
  }
  if (DESTINATARIOS.length === 0) {
    console.warn('[precios-email] sin destinatarios — no se manda el resumen');
    return;
  }
  try {
    const resumen = await construirResumenPrecios(error);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error: errEnvio } = await resend.emails.send({
      from: FROM,
      to: DESTINATARIOS,
      subject: asuntoResumen(resumen),
      html: buildPreciosEmailHtml(resumen),
    });
    if (errEnvio) {
      console.error('[precios-email] Resend rechazó el envío:', errEnvio);
      return;
    }
    console.log(
      `[precios-email] resumen enviado a ${DESTINATARIOS.join(', ')} (id ${data?.id}) — ` +
      `${resumen.aplicadas.length} aplicadas, ${resumen.pendientes.length} pendientes`
    );
  } catch (e: any) {
    console.error('[precios-email] no se pudo mandar el resumen:', e?.message || e);
  }
}
