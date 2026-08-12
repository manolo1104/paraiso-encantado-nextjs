/**
 * Correos de recuperación de reservas incompletas.
 *
 * Se disparan cuando alguien completó el paso de datos (/reservar/checkout) pero
 * no pagó. Deliberadamente NO ofrecen descuento: el objetivo es quitar fricción
 * y recordar, no enseñarle al huésped que abandonar el carrito abarata la noche.
 */

const SITE = 'https://www.paraisoencantado.com';
const WA = 'https://wa.me/524891007679';

function fmtFecha(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  const s = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtMXN(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')} MXN`;
}

export interface RecoveryEmailData {
  nombre: string;
  checkin: string;
  checkout: string;
  noches: number;
  habitaciones: string;
  total: number;
  pagaHoy: number;
  /** Enlace que reconstruye el carrito tal cual lo dejó */
  resumeUrl: string;
  /** 1 = primer recordatorio (~1 h), 2 = segundo (~24 h) */
  variant: 1 | 2;
}

export function recoverySubject(data: RecoveryEmailData): string {
  const primerNombre = data.nombre.trim().split(/\s+/)[0] || '';
  return data.variant === 1
    ? `${primerNombre}, tu suite en Xilitla sigue apartada`
    : `¿Seguimos con tu escapada a Xilitla, ${primerNombre}?`;
}

export function buildRecoveryEmailHtml(data: RecoveryEmailData): string {
  const primerNombre = data.nombre.trim().split(/\s+/)[0] || 'Hola';

  const intro = data.variant === 1
    ? `Vimos que dejaste tu reserva a medio camino. No te preocupes: <strong>no se te cobró nada</strong> y tus fechas siguen aquí.`
    : `Tu reserva sigue sin completarse. Las fechas que elegiste son de las más solicitadas del año, y no podemos apartarlas indefinidamente.`;

  const cierre = data.variant === 1
    ? `Retomar te toma menos de un minuto — ya tenemos tus datos.`
    : `Si algo te detuvo (una duda, el método de pago, las fechas), respóndenos este correo o escríbenos por WhatsApp y lo resolvemos contigo.`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu reserva en Paraíso Encantado</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#faf8f5;border-radius:4px;overflow:hidden;">

  <tr><td style="background:#1c2b1e;padding:36px 48px;text-align:center;">
    <h1 style="margin:0;font-size:26px;font-weight:300;color:#f5f0e8;line-height:1.2;font-family:Georgia,serif;">Paraíso <em style="font-style:italic;color:#c9a96e;">Encantado</em></h1>
    <p style="margin:8px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(138,158,140,0.8);">Xilitla · Huasteca Potosina</p>
  </td></tr>

  <tr><td style="padding:44px 48px 32px;">
    <p style="margin:0 0 20px;font-size:22px;font-weight:300;color:#1c2b1e;line-height:1.3;font-family:Georgia,serif;">${primerNombre}, tu reserva quedó <em style="font-style:italic;">sin terminar.</em></p>
    <p style="margin:0 0 24px;font-size:15px;color:#5a5a4a;line-height:1.8;">${intro}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f2ec;border-left:3px solid #c9a96e;margin:0 0 28px;">
      <tr><td style="padding:22px 24px;">
        <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;">Lo que apartaste</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#3a3a2e;">
          <tr><td style="padding:4px 0;">Llegada</td><td align="right" style="padding:4px 0;font-weight:600;">${fmtFecha(data.checkin)}</td></tr>
          <tr><td style="padding:4px 0;">Salida</td><td align="right" style="padding:4px 0;font-weight:600;">${fmtFecha(data.checkout)}</td></tr>
          <tr><td style="padding:4px 0;">Noches</td><td align="right" style="padding:4px 0;font-weight:600;">${data.noches}</td></tr>
          <tr><td style="padding:4px 0;">Suite</td><td align="right" style="padding:4px 0;font-weight:600;">${data.habitaciones}</td></tr>
          <tr><td style="padding:10px 0 4px;border-top:1px solid #e4ddd3;">Total estadía</td><td align="right" style="padding:10px 0 4px;border-top:1px solid #e4ddd3;font-weight:600;">${fmtMXN(data.total)}</td></tr>
          ${data.pagaHoy < data.total ? `<tr><td style="padding:4px 0;color:#5a7a5c;">Pagas ahora (50%)</td><td align="right" style="padding:4px 0;font-weight:600;color:#5a7a5c;">${fmtMXN(data.pagaHoy)}</td></tr>` : ''}
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 28px;font-size:14px;color:#5a5a4a;line-height:1.8;">${cierre}</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
      <tr><td style="background:#1c2b1e;padding:16px 36px;border-radius:2px;text-align:center;">
        <a href="${data.resumeUrl}" style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a96e;text-decoration:none;">Terminar mi reserva</a>
      </td></tr>
    </table>

    <p style="margin:0 0 6px;font-size:12px;color:#9a9a82;line-height:1.7;text-align:center;">
      Cancelación gratuita hasta 7 días antes · Reserva directa sin comisiones
    </p>
    <p style="margin:0;font-size:12px;color:#9a9a82;line-height:1.7;text-align:center;">
      ¿Dudas? Escríbenos por <a href="${WA}" style="color:#5a7a5c;">WhatsApp +52 489 100 7679</a>
    </p>
  </td></tr>

  <tr><td style="background:#f0ece3;padding:22px 48px;text-align:center;border-top:1px solid #e8e4da;">
    <p style="margin:0 0 6px;font-size:13px;font-style:italic;color:#7a7a6a;font-family:Georgia,serif;">Paraíso Encantado</p>
    <p style="margin:0;font-size:11px;color:#9a9a82;line-height:1.8;">Xilitla, San Luis Potosí 79910 · México<br>A 5 min del Jardín de Edward James</p>
    <p style="margin:10px 0 0;font-size:10px;color:#b0b0a0;">Recibes este correo porque empezaste una reserva en <a href="${SITE}" style="color:#9a9a82;">paraisoencantado.com</a>.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
