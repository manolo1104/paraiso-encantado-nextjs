export function buildQuoteEmailHtml(data: {
  customerName: string;
  quoteId: string;
  suite: string;
  checkin: string;
  checkout: string;
  nights: number;
  total: number;
  notas?: string;
}): string {
  const base = 'https://www.paraisoencantado.com';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T12:00:00');
    const f = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
    return f.charAt(0).toUpperCase() + f.slice(1);
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu cotización — ${data.quoteId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
    * { margin:0; padding:0; }
    body { font-family:'Jost','Helvetica Neue',Arial,sans-serif; background-color:#f0ebe3; line-height:1.6; }
    table { border-collapse:collapse; }
    a { color:#2a2218; text-decoration:none; }
    .wrapper { background-color:#f0ebe3; padding:20px 0; }
    .container { max-width:620px; margin:0 auto; background-color:#faf8f5; }
    @media only screen and (max-width:640px) {
      .wrapper { padding:0!important; }
      .container { width:100%!important; max-width:100%!important; }
      .mobile-padding { padding-left:24px!important; padding-right:24px!important; }
      .mobile-padding-lg { padding:34px 24px!important; }
    }
  </style>
</head>
<body>
<div class="wrapper">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td style="padding:16px 0;text-align:center;">
      <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a7d6b;">Xilitla &middot; San Luis Potosí &middot; México</p>
    </td></tr>
  </table>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center">
      <table class="container" role="presentation" width="620" cellspacing="0" cellpadding="0" border="0">

        <!-- HERO -->
        <tr><td class="mobile-padding-lg" style="padding:34px 40px 38px 40px;background-color:#2f281f;">
          <p style="margin:0 0 8px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3.5px;text-transform:uppercase;color:rgba(255,255,255,0.72);">Cotización Personalizada</p>
          <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;font-style:italic;font-weight:300;color:#ffffff;line-height:1.1;">Tu escapada perfecta.</h1>
          <p style="margin:14px 0 0 0;font-family:'Jost','Helvetica Neue',Arial;font-size:14px;font-weight:300;color:rgba(255,255,255,0.8);line-height:1.7;">Hemos preparado esta cotización especialmente para ti.</p>
        </td></tr>

        <!-- MAIN -->
        <tr><td class="mobile-padding-lg" style="background-color:#faf8f5;padding:52px 48px;">
          <p style="margin:0 0 8px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#2a2218;line-height:1.2;">
            Hola, <span style="font-style:italic;color:#7a6a52;">${data.customerName}</span>
          </p>
          <p style="margin:24px 0 32px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:15px;font-weight:300;color:#4a3f30;line-height:1.85;">
            Aquí está la cotización que solicitaste para tu estancia en Hotel Paraíso Encantado. Esta cotización es válida por <strong>48 horas</strong>.
          </p>

          <table role="presentation" width="48" cellspacing="0" cellpadding="0" border="0">
            <tr><td style="height:1px;background-color:#c9b99a;"></td></tr>
          </table>

          <!-- QUOTE ID -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0;">
            <tr><td style="border:1px solid #c9b99a;background-color:#fdf9f4;padding:22px 28px;">
              <p style="margin:0 0 6px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;">Referencia</p>
              <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:500;color:#2a2218;">${data.quoteId}</p>
            </td></tr>
          </table>

          <!-- DETAILS -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px 0;">
            <tr>
              <td style="width:50%;border:1px solid #e4ddd3;padding:20px 22px;vertical-align:top;">
                <p style="margin:0 0 10px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;">Suite</p>
                <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#2a2218;">${data.suite}</p>
              </td>
              <td style="width:50%;border:1px solid #e4ddd3;border-left:none;padding:20px 22px;vertical-align:top;">
                <p style="margin:0 0 10px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;">Duración</p>
                <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#2a2218;">${data.nights} noche${data.nights !== 1 ? 's' : ''}</p>
              </td>
            </tr>
            <tr>
              <td style="width:50%;border:1px solid #e4ddd3;border-top:none;padding:20px 22px;vertical-align:top;">
                <p style="margin:0 0 10px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;">Check-in</p>
                <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">${formatDate(data.checkin)}</p>
                <p style="margin:4px 0 0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;color:#9a8a74;">A partir de las 3:00 PM</p>
              </td>
              <td style="width:50%;border:1px solid #e4ddd3;border-top:none;border-left:none;padding:20px 22px;vertical-align:top;">
                <p style="margin:0 0 10px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;">Check-out</p>
                <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">${formatDate(data.checkout)}</p>
                <p style="margin:4px 0 0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;color:#9a8a74;">Antes de las 12:00 PM</p>
              </td>
            </tr>
          </table>

          <!-- TOTAL -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#2a2218;margin:0 0 32px 0;">
            <tr><td class="mobile-padding" style="padding:24px 48px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td><p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9b99a;">Total Cotización</p></td>
                  <td style="text-align:right;">
                    <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#faf8f5;">
                      $${data.total.toLocaleString('es-MX')}<span style="font-size:14px;color:#c9b99a;"> MXN</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          ${data.notas ? `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-left:2px solid #c9b99a;padding-left:24px;margin:0 0 32px 0;">
            <tr><td>
              <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-style:italic;font-weight:300;color:#5a4e3c;line-height:1.7;">${data.notas}</p>
            </td></tr>
          </table>` : ''}

          <p style="margin:0 0 12px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#4a3f30;font-weight:300;">Esta cotización es válida por 48 horas. Para confirmar tu reserva:</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
            <tr><td style="background-color:#2a2218;padding:16px 38px;">
              <a href="${base}/reservar?checkin=${data.checkin}&checkout=${data.checkout}" style="font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#faf8f5;text-decoration:none;display:block;">Confirmar Reserva</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- CONTACT -->
        <tr><td class="mobile-padding" style="background-color:#faf8f5;padding:32px 48px;border-top:1px solid #e4ddd3;">
          <p style="margin:0 0 8px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#2a2218;">📞 <a href="tel:+524891007679" style="color:#2a2218;">489-100-7679</a></p>
          <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#2a2218;">💬 <a href="https://wa.me/524891007679" style="color:#2a2218;">WhatsApp directo</a></p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td class="mobile-padding-lg" style="background-color:#f0ebe3;padding:44px 48px;text-align:center;">
          <p style="margin:0 0 12px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;letter-spacing:3px;text-transform:uppercase;color:#8a7d6b;">Paraíso Encantado</p>
          <p style="margin:0 0 16px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;color:#a09080;line-height:1.6;">
            Hotel Paraíso Encantado &middot; Xilitla, San Luis Potosí &middot; México
          </p>
          <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;color:#b8aa9a;">
            © ${new Date().getFullYear()} Hotel Paraíso Encantado · Todos los derechos reservados
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</div>
</body>
</html>`;
}


import { buildBookingHtml, calcCancelDate72h, fmtDateFull } from './booking-html';

const SUITE_IMAGES_EMAIL: Record<string, string> = {
  'Suite Flor de Liz 1': '/images/FLOR DE LIS 1/PORTADA.jpg',
  'Suite Flor de Liz 2': '/images/FLOR DE LIS 2/PORTADA.jpeg',
  'Suite LindaVista': '/images/LINDAVISTA/PORTADA.jpg',
  'Jungla': '/images/JUNGLA/PORTADA.JPG',
  'Suite Lajas': '/images/LAJAS/PORTADA.jpg',
  'Lirios 1': '/images/LIRIOS 1/PORTADA.jpg',
  'Lirios 2': '/images/LIRIOS 2/PORTADA.jpg',
  'Orquídeas 2': '/images/ORQUIDEAS 2/PORTADA.jpg',
  'Orquídeas Doble': '/images/ORQUIDEAS DOBLE/PORTADA.jpg',
  'Orquídeas 3': '/images/ORQUIDEAS 3/PORTADA.jpg',
  'Bromelias': '/images/BROMELIAS 1/PORTADA.jpg',
  'Helechos 1': '/images/HELECHOS 1/PORTADA.jpg',
  'Helechos 2': '/images/HELECHOS 2/PORTADA.jpg',
};
const SUITE_IMAGES_EMAIL_2: Record<string, string> = {
  'Suite Flor de Liz 1': '/images/FLOR DE LIS 1/DSCF1191.jpg',
  'Suite Flor de Liz 2': '/images/FLOR DE LIS 2/Copia de FDL2.jpg',
  'Suite LindaVista': '/images/LINDAVISTA/Copia de DSC09539-HDR.jpg',
  'Jungla': '/images/JUNGLA/DSCF1065.jpg',
  'Suite Lajas': '/images/LAJAS/Copia de DSC09589-HDR.jpg',
  'Lirios 1': '/images/LIRIOS 1/Copia de DSC09524-HDR.jpg',
  'Lirios 2': '/images/LIRIOS 2/Copia de DSC09483-HDR.jpg',
  'Orquídeas 2': '/images/ORQUIDEAS 2/Copia de DSC09568-HDR.jpg',
  'Orquídeas Doble': '/images/ORQUIDEAS DOBLE/Copia de DSC09602-HDR.jpg',
  'Orquídeas 3': '/images/ORQUIDEAS 3/Copia de DSC09567-HDR.jpg',
  'Bromelias': '/images/BROMELIAS 1/Copia de DSC09385-HDR.jpg',
  'Helechos 1': '/images/HELECHOS 1/Copia de DSC09461-HDR 2.jpg',
  'Helechos 2': '/images/HELECHOS 2/Copia de DSC09461-HDR.jpg',
};
const SUITE_IMAGES_EMAIL_3: Record<string, string> = {
  'Suite Flor de Liz 1': '/images/FLOR DE LIS 1/DSCF1312.jpeg',
  'Suite Flor de Liz 2': '/images/FLOR DE LIS 2/DSCF1191.jpg',
  'Suite LindaVista': '/images/LINDAVISTA/Copia de DSC09569.jpg',
  'Jungla': '/images/JUNGLA/DSCF1078.jpg',
  'Suite Lajas': '/images/LAJAS/Copia de DSC09610-HDR.jpg',
  'Lirios 1': '/images/LIRIOS 1/Copia de DSCF1620.jpg',
  'Lirios 2': '/images/LIRIOS 2/Copia de DSC09489-2.jpg',
  'Orquídeas 2': '/images/ORQUIDEAS 2/DSCF1607.jpg',
  'Orquídeas Doble': '/images/ORQUIDEAS DOBLE/Copia de DSCF1607.jpg',
  'Orquídeas 3': '/images/ORQUIDEAS 3/PORTADA.jpg',
  'Bromelias': '/images/BROMELIAS 1/Copia de DSC09419-HDR.jpg',
  'Helechos 1': '/images/HELECHOS 1/Copia de DSC09516-HDR.jpg',
  'Helechos 2': '/images/HELECHOS 2/Copia de DSC09556-HDR.jpg',
};

export function buildEmailHtml(data: {
  customerName: string;
  confirmationNumber: string;
  paymentIntentId?: string;
  checkin?: string;
  checkout?: string;
  nights?: number;
  adults?: number;
  minors?: number;
  guests?: number;
  rooms?: { name: string; guestCount?: number; totalPrice?: number }[];
  total?: number;
  amountPaid?: number;
  amountPending?: number;
  isDeposit?: boolean;
  anticipo?: number;
  notas?: string;
}): string {
  const base = 'https://www.paraisoencantado.com';
  const INTERNO_SEP = '||INTERNO||';

  const suites = (data.rooms || []).map(r => r.name).filter(Boolean);
  if (suites.length === 0 && data.rooms?.[0]?.name) suites.push(data.rooms[0].name);

  const firstSuite = suites[0] || '';
  const suiteImgSrc  = firstSuite && SUITE_IMAGES_EMAIL[firstSuite]   ? base + SUITE_IMAGES_EMAIL[firstSuite]   : '';
  const suiteImgSrc2 = firstSuite && SUITE_IMAGES_EMAIL_2[firstSuite] ? base + SUITE_IMAGES_EMAIL_2[firstSuite] : '';
  const suiteImgSrc3 = firstSuite && SUITE_IMAGES_EMAIL_3[firstSuite] ? base + SUITE_IMAGES_EMAIL_3[firstSuite] : '';

  const notasRaw = data.notas || '';
  const idx = notasRaw.indexOf(INTERNO_SEP);
  const notasClienteText = idx === -1 ? notasRaw.trim() : notasRaw.slice(0, idx).trim();

  const checkin  = data.checkin  || '';
  const checkout = data.checkout || '';
  const noches   = data.nights   || 0;
  const huespedes = data.adults || data.guests || 0;
  const total     = data.total || 0;
  const anticipo  = data.anticipo || 0;

  return buildBookingHtml({
    confirmacion: data.confirmationNumber,
    cliente: data.customerName,
    suites: suites.length > 0 ? suites : ['Suite'],
    checkin,
    checkout,
    noches,
    huespedes,
    total,
    anticipo,
    restante: total - anticipo,
    cancelDateStr: calcCancelDate72h(checkin),
    fechaLimiteStr: fmtDateFull(checkin),
    notasClienteText,
    suiteImgSrc,
    suiteImgSrc2,
    suiteImgSrc3,
    forPrint: false,
  });
}
