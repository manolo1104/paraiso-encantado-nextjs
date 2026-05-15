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
  const BASE = 'https://www.paraisoencantado.com';
  const INTERNO_SEP = '||INTERNO||';

  // Normalize room names (web bookings store "Suite X (2 personas)")
  const rawRooms = (data.rooms || []);
  const suites = rawRooms.map(r => ({
    name: (r.name || '').replace(/\s*\([^)]*\)/g, '').trim(),
    guests: r.guestCount || 0,
  })).filter(r => r.name);
  if (suites.length === 0) suites.push({ name: 'Suite', guests: 0 });

  const firstRoom = suites[0].name;
  const suiteImg = SUITE_IMAGES_EMAIL[firstRoom] ? `${BASE}${SUITE_IMAGES_EMAIL[firstRoom]}` : '';

  const notasRaw = data.notas || '';
  const notasIdx = notasRaw.indexOf(INTERNO_SEP);
  const notasCliente = notasIdx === -1 ? notasRaw.trim() : notasRaw.slice(0, notasIdx).trim();

  const checkin  = data.checkin  || '';
  const checkout = data.checkout || '';
  const nights   = data.nights   || 0;
  const guests   = data.adults   || data.guests || 0;
  const total    = data.total    || 0;
  // Handle both admin anticipo and public amountPaid
  const anticipo = data.anticipo || data.amountPaid || 0;
  const restante = anticipo > 0 ? Math.max(0, total - anticipo) : 0;

  const cancelDate = (() => {
    if (!checkin) return 'Ver política de cancelación';
    const d = new Date(checkin + 'T00:00:00');
    d.setDate(d.getDate() - 3);
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()} a las 11:59 PM`;
  })();

  const fmt = (ds: string) => {
    if (!ds) return '—';
    const [y, m, d] = ds.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
  };

  const fmtFull = (ds: string) => {
    if (!ds) return '—';
    const [y, m, d] = ds.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${parseInt(d)} de ${months[parseInt(m)-1]} ${y}`;
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmación ${data.confirmationNumber} · Paraíso Encantado</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #f5f2ec; font-family: 'Jost', sans-serif; font-weight: 300; color: #2a2a25; padding: 32px 16px; }
.wrap { max-width: 600px; margin: 0 auto; background: #fffdf8; border: 1px solid #ddd8cc; }
.header { background: #1c2b1e; padding: 40px 40px 36px; text-align: center; position: relative; overflow: hidden; }
.header::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
.h-eye { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: #c9a96e; margin-bottom: 14px; position: relative; }
.h-logo { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 300; color: #f5f0e8; margin-bottom: 5px; position: relative; }
.h-logo em { font-style: italic; color: #c9a96e; }
.h-sub { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8a9e8c; margin-bottom: 28px; position: relative; }
.h-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(201,169,110,0.15); border: 1px solid rgba(201,169,110,0.4); color: #c9a96e; padding: 8px 20px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; position: relative; }
.h-badge::before { content: '✓'; font-size: 12px; }
.suite-photo { height: 180px; overflow: hidden; display: block; border-bottom: 2px solid #c9a96e; background: linear-gradient(160deg, #2d4a2f 0%, #1c3320 50%, #152a1a 100%); text-align: center; line-height: 180px; }
.suite-photo img { width: 100%; height: 180px; object-fit: cover; display: block; }
.cn-block { background: #1c2b1e; padding: 18px 40px; display: flex; align-items: center; justify-content: space-between; }
.cn-lbl { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #6a8a6e; margin-bottom: 4px; }
.cn-num { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; color: #c9a96e; letter-spacing: 2px; }
.cn-pres { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #6a8a6e; text-align: right; line-height: 1.8; }
.cn-pres span { display: block; color: #f5f0e8; font-size: 11px; }
.body { padding: 36px 40px; }
.greeting { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 300; color: #1c2b1e; margin-bottom: 6px; }
.greeting em { font-style: italic; }
.g-sub { font-size: 13px; color: #7a7a6a; line-height: 1.7; margin-bottom: 32px; }
.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #ddd8cc; border: 1px solid #ddd8cc; margin-bottom: 28px; }
.d-cell { background: #fffdf8; padding: 18px 22px; }
.d-lbl { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #9a9a8a; margin-bottom: 5px; }
.d-val { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; color: #1c2b1e; line-height: 1.3; }
.d-sub { font-size: 11px; color: #9a9a8a; margin-top: 3px; }
.sec-title { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #9a9a8a; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #eae6dd; }
.suites-sec { margin-bottom: 28px; }
.s-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #eae6dd; }
.s-row:last-child { border-bottom: none; }
.s-name { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 400; color: #1c2b1e; }
.s-pax { font-size: 11px; color: #8a8a7a; margin-top: 2px; }
.pay-block { background: #f5f2ec; border-left: 3px solid #c9a96e; padding: 18px 22px; margin-bottom: 28px; }
.p-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #5a5a4a; margin-bottom: 8px; }
.p-row:last-child { margin-bottom: 0; }
.p-row.divider { border-top: 1px solid #ddd8cc; padding-top: 12px; margin-top: 4px; font-size: 14px; color: #1c2b1e; }
.p-row.divider .amt { font-family: 'Cormorant Garamond', serif; font-size: 20px; }
.paid-tag { font-size: 11px; color: #5a7a5c; display: flex; align-items: center; gap: 4px; }
.paid-tag::before { content: '✓'; }
.cancel-sec { display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-top: 1px solid #eae6dd; border-bottom: 1px solid #eae6dd; margin-bottom: 28px; }
.cancel-icon { width: 30px; height: 30px; background: #eef5ef; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; color: #5a7a5c; }
.cancel-title { font-size: 12px; font-weight: 500; color: #1c2b1e; margin-bottom: 2px; }
.cancel-sub { font-size: 12px; color: #8a8a7a; line-height: 1.6; }
.cancel-date { color: #1c2b1e; font-weight: 500; }
.llegada { margin-bottom: 28px; }
.step { display: flex; align-items: flex-start; gap: 12px; font-size: 13px; color: #5a5a4a; line-height: 1.6; margin-bottom: 12px; }
.step:last-child { margin-bottom: 0; }
.step-n { width: 22px; height: 22px; background: #1c2b1e; color: #c9a96e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; flex-shrink: 0; margin-top: 1px; }
.maps-a { display: inline-block; margin-top: 4px; font-size: 11px; color: #5a7a5c; text-decoration: underline; text-underline-offset: 2px; }
.upsell { background: #1c2b1e; padding: 24px 28px; text-align: center; margin-bottom: 28px; }
.ups-eye { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #6a8a6e; margin-bottom: 7px; }
.ups-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300; font-style: italic; color: #f5f0e8; margin-bottom: 7px; }
.ups-sub { font-size: 12px; color: #8a9e8c; margin-bottom: 16px; line-height: 1.6; }
.ups-btn { display: inline-block; border: 1px solid #c9a96e; color: #c9a96e; padding: 9px 24px; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; text-decoration: none; font-family: 'Jost', sans-serif; }
.contact-row { display: flex; gap: 10px; margin-bottom: 28px; }
.c-card { flex: 1; border: 1px solid #eae6dd; padding: 14px; text-align: center; }
.c-icon { font-size: 16px; margin-bottom: 5px; }
.c-type { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #9a9a8a; margin-bottom: 3px; }
.c-val { font-size: 11px; color: #1c2b1e; font-weight: 400; }
.trust { display: flex; justify-content: center; gap: 28px; padding: 18px 0; border-top: 1px solid #eae6dd; }
.t-item { text-align: center; }
.t-lbl { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #9a9a8a; margin-bottom: 2px; }
.t-val { font-size: 12px; color: #5a7a5c; }
.footer { background: #f0ece3; padding: 24px 40px; text-align: center; border-top: 1px solid #ddd8cc; }
.f-logo { font-family: 'Cormorant Garamond', serif; font-size: 15px; font-style: italic; color: #7a7a6a; margin-bottom: 8px; }
.f-addr { font-size: 11px; color: #9a9a8a; line-height: 1.8; }
.f-div { width: 36px; height: 1px; background: #c9a96e; margin: 14px auto; }
.f-social { font-size: 10px; letter-spacing: 2px; color: #9a9a8a; text-transform: uppercase; }
${notasCliente ? `.note-box { background: #fff8ee; border-left: 3px solid #c9a96e; padding: 12px 18px; margin-bottom: 24px; font-size: 13px; color: #5a4e3c; font-style: italic; line-height: 1.6; }` : ''}
@media (max-width: 480px) {
  .body { padding: 24px; }
  .header { padding: 32px 24px 28px; }
  .cn-block { padding: 14px 24px; flex-direction: column; gap: 6px; text-align: center; }
  .details-grid { grid-template-columns: 1fr; }
  .contact-row { flex-direction: column; }
  .footer { padding: 20px 24px; }
  .trust { gap: 16px; }
}
</style>
</head>
<body>
<div class="wrap">

  <div class="header">
    <p class="h-eye">Tu escapada está confirmada</p>
    <h1 class="h-logo">Paraíso <em>Encantado</em></h1>
    <p class="h-sub">Xilitla · Huasteca Potosina</p>
    <div class="h-badge">Reserva confirmada</div>
  </div>

  ${suiteImg
    ? `<div class="suite-photo"><img src="${suiteImg}" alt="${firstRoom}" onerror="this.parentElement.style.display='none'"></div>`
    : `<div class="suite-photo" style="line-height:180px;color:#c9a96e;font-family:'Cormorant Garamond',serif;font-size:22px;font-style:italic">${firstRoom}</div>`
  }

  <div class="cn-block">
    <div>
      <p class="cn-lbl">Número de confirmación</p>
      <p class="cn-num">${data.confirmationNumber}</p>
    </div>
    <p class="cn-pres">Al llegar presenta<span>este número</span></p>
  </div>

  <div class="body">

    <h2 class="greeting">Bienvenido/a, <em>${data.customerName}.</em></h2>
    <p class="g-sub">Tu paraíso te espera. Aquí tienes todo lo que necesitas para llegar y disfrutar al máximo.</p>

    <div class="details-grid">
      <div class="d-cell">
        <p class="d-lbl">Check-in</p>
        <p class="d-val">${fmt(checkin)}</p>
        <p class="d-sub">A partir de las 3:00 PM</p>
      </div>
      <div class="d-cell">
        <p class="d-lbl">Check-out</p>
        <p class="d-val">${fmt(checkout)}</p>
        <p class="d-sub">Antes de las 12:00 PM</p>
      </div>
      <div class="d-cell">
        <p class="d-lbl">Noches</p>
        <p class="d-val">${nights}</p>
      </div>
      <div class="d-cell">
        <p class="d-lbl">Huéspedes</p>
        <p class="d-val">${guests} persona${guests !== 1 ? 's' : ''}</p>
      </div>
    </div>

    <div class="suites-sec">
      <p class="sec-title">Suites reservadas</p>
      ${suites.map(s => `
      <div class="s-row">
        <div><p class="s-name">${s.name}</p>${s.guests > 0 ? `<p class="s-pax">Hasta ${s.guests} persona${s.guests !== 1 ? 's' : ''}</p>` : ''}</div>
        <span style="font-size:11px;color:#5a7a5c">incluida</span>
      </div>`).join('')}
    </div>

    <div class="pay-block">
      <div class="p-row">
        <span>Total estadía</span>
        <span>$${total.toLocaleString('es-MX')} MXN</span>
      </div>
      ${anticipo > 0 ? `
      <div class="p-row">
        <span class="paid-tag">Anticipo recibido</span>
        <span style="color:#5a7a5c">− $${anticipo.toLocaleString('es-MX')} MXN</span>
      </div>` : ''}
      <div class="p-row divider">
        <span>${anticipo > 0 ? 'Saldo al check-in' : 'Total a pagar'}</span>
        <span class="amt">$${anticipo > 0 ? restante.toLocaleString('es-MX') : total.toLocaleString('es-MX')} MXN</span>
      </div>
    </div>

    ${notasCliente ? `<div class="note-box">${notasCliente}</div>` : ''}

    <div class="cancel-sec">
      <div class="cancel-icon">✓</div>
      <div>
        <p class="cancel-title">Cancelación gratuita</p>
        <p class="cancel-sub">Puedes cancelar sin costo hasta el <span class="cancel-date">${cancelDate}.</span> Después de esa fecha aplica el cargo completo.</p>
      </div>
    </div>

    <div class="llegada">
      <p class="sec-title">Tu llegada</p>
      <div class="step">
        <div class="step-n">1</div>
        <div>Llega a Xilitla por la carretera 120. Al entrar, sigue las señales hacia <strong>Las Pozas / Jardín de Edward James.</strong><br>
        <a href="https://www.google.com/maps/search/Hotel+Paraíso+Encantado,+Xilitla,+San+Luis+Potosí" class="maps-a">Abrir en Google Maps →</a></div>
      </div>
      <div class="step">
        <div class="step-n">2</div>
        <div>Estamos a <strong>400 metros antes del Jardín Surrealista,</strong> sobre la misma calle. A 5 min caminando.</div>
      </div>
      <div class="step">
        <div class="step-n">3</div>
        <div>¿Llegas tarde o tienes dudas? Escríbenos por WhatsApp y te guiamos.</div>
      </div>
    </div>

    <div class="upsell">
      <p class="ups-eye">¿Celebras algo especial?</p>
      <h3 class="ups-title">Personaliza tu escapada</h3>
      <p class="ups-sub">Desayuno en la terraza · Decoración de suite · Arreglo floral<br>Cuéntanos y lo preparamos antes de tu llegada.</p>
      <a href="https://wa.me/524891007679" class="ups-btn">Escribir por WhatsApp</a>
    </div>

    <div class="contact-row">
      <div class="c-card"><p class="c-icon">📞</p><p class="c-type">Teléfono</p><p class="c-val"><a href="tel:+524891007679" style="color:#1c2b1e;text-decoration:none">489 100 7679</a></p></div>
      <div class="c-card"><p class="c-icon">💬</p><p class="c-type">WhatsApp</p><p class="c-val"><a href="https://wa.me/524891007679" style="color:#1c2b1e;text-decoration:none">+52 489 100 7679</a></p></div>
      <div class="c-card"><p class="c-icon">✉️</p><p class="c-type">Email</p><p class="c-val"><a href="mailto:reservas@paraisoencantado.com" style="color:#1c2b1e;text-decoration:none;font-size:10px">reservas@paraisoencantado.com</a></p></div>
    </div>

    <div class="trust">
      <div class="t-item"><p class="t-lbl">Reserva</p><p class="t-val">✓ Directa</p></div>
      <div class="t-item"><p class="t-lbl">Estacionamiento</p><p class="t-val">✓ Gratuito</p></div>
      <div class="t-item"><p class="t-lbl">WiFi</p><p class="t-val">✓ Alta velocidad</p></div>
    </div>

  </div>

  <div class="footer">
    <p class="f-logo">Paraíso Encantado</p>
    <div class="f-div"></div>
    <p class="f-addr">Xilitla, San Luis Potosí 79910 · México<br>A 5 minutos caminando del Jardín Surrealista de Edward James<br><a href="https://paraisoencantado.com" style="color:#9a9a8a">paraisoencantado.com</a></p>
    <div class="f-div"></div>
    <p class="f-social">@_paraiso_encantado</p>
  </div>

</div>
</body>
</html>`;
}
