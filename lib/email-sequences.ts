// Templates HTML para las 5 secuencias de email automatizadas
// Mismo estilo que lib/email.ts: Cormorant Garamond + Jost, hero oscuro, crema

const BASE_URL = 'https://www.paraisoencantado.com';
const REVIEW_URL = process.env.GOOGLE_MAPS_REVIEW_URL ||
  'https://search.google.com/local/writereview?placeid=ChIJj_GQ9t76mojbAQ';
const WA_NUMBER = '524891007679';
const PROMO_CODE = 'REGRESA10';
const PROMO_DISCOUNT = '10%';

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
  *{margin:0;padding:0;}
  body{font-family:'Jost','Helvetica Neue',Arial,sans-serif;background-color:#f0ebe3;line-height:1.6;}
  table{border-collapse:collapse;}
  a{color:#2a2218;text-decoration:none;}
  .wrapper{background-color:#f0ebe3;padding:20px 0;}
  .container{max-width:620px;margin:0 auto;background-color:#faf8f5;}
  @media only screen and (max-width:640px){
    .wrapper{padding:0!important;}
    .container{width:100%!important;max-width:100%!important;}
    .mp{padding-left:24px!important;padding-right:24px!important;}
    .mplg{padding:34px 24px!important;}
  }
`;

function formatDateEs(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  const f = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  return f.charAt(0).toUpperCase() + f.slice(1);
}

function hero(eyebrow: string, title: string, sub: string, badge?: string) {
  return `
  <tr><td class="mplg" style="padding:34px 40px 38px;background-color:#2f281f;">
    <p style="margin:0 0 8px;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3.5px;text-transform:uppercase;color:rgba(255,255,255,0.72);">${eyebrow}</p>
    <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;font-style:italic;font-weight:300;color:#fff;line-height:1.1;">${title}</h1>
    <p style="margin:14px 0 0;font-family:'Jost','Helvetica Neue',Arial;font-size:14px;font-weight:300;color:rgba(255,255,255,0.8);line-height:1.7;">${sub}</p>
    ${badge ? `<div style="display:inline-block;margin-top:14px;background:${badge.startsWith('#') ? badge : '#2d7a34'};color:#fff;font-family:'Jost',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;">${badge.startsWith('#') ? '' : badge}</div>` : ''}
  </td></tr>`;
}

function greeting(name: string) {
  const first = name.trim().split(' ')[0];
  return `<p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#2a2218;line-height:1.2;">Hola, <span style="font-style:italic;color:#7a6a52;">${first}</span></p>`;
}

function divider() {
  return `<table role="presentation" width="48" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;"><tr><td style="height:1px;background-color:#c9b99a;"></td></tr></table>`;
}

function ctaButton(text: string, url: string, color = '#2a2218') {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px auto;">
    <tr><td style="background-color:${color};padding:16px 38px;">
      <a href="${url}" style="font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#faf8f5;text-decoration:none;display:block;">${text}</a>
    </td></tr>
  </table>`;
}

function contact() {
  return `
  <tr><td class="mp" style="background-color:#faf8f5;padding:32px 48px;border-top:1px solid #e4ddd3;">
    <p style="margin:0 0 8px;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#2a2218;">📞 <a href="tel:+524891007679" style="color:#2a2218;">+52 489-100-7679</a></p>
    <p style="margin:0 0 8px;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#2a2218;">📧 <a href="mailto:reservas@paraisoencantado.com" style="color:#2a2218;">reservas@paraisoencantado.com</a></p>
    <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#2a2218;">💬 <a href="https://wa.me/${WA_NUMBER}" style="color:#2a2218;">WhatsApp directo</a></p>
  </td></tr>`;
}

function footer() {
  return `
  <tr><td class="mplg" style="background-color:#f0ebe3;padding:44px 48px;text-align:center;">
    <p style="margin:0 0 12px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;letter-spacing:3px;text-transform:uppercase;color:#8a7d6b;">Paraíso Encantado</p>
    <p style="margin:0 0 16px;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;color:#a09080;line-height:1.6;">Hotel Paraíso Encantado · Xilitla, San Luis Potosí 79910 · México<br>A pasos del Jardín Surrealista de Edward James</p>
    <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;color:#b8aa9a;">© ${new Date().getFullYear()} Hotel Paraíso Encantado · Todos los derechos reservados</p>
  </td></tr>`;
}

function wrap(subject: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
<style>${BASE_CSS}</style>
</head><body>
<div class="wrapper">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td style="padding:16px 0;text-align:center;">
      <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a7d6b;">Xilitla · San Luis Potosí · México</p>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center">
      <table class="container" role="presentation" width="620" cellspacing="0" cellpadding="0" border="0">
        ${body}
        ${contact()}
        ${footer()}
      </table>
    </td></tr>
  </table>
</div></body></html>`;
}

// ── 1. Post-stay +1 día: Encuesta de satisfacción ──────────────────────────
export function buildSurveyEmailHtml(data: {
  customerName: string; confirmacion: string;
  checkin: string; checkout: string; habitaciones: string;
}): string {
  const first = data.customerName.trim().split(' ')[0];
  const starsHtml = [1,2,3,4,5].map(n => {
    const url = `${BASE_URL}/api/feedback?conf=${encodeURIComponent(data.confirmacion)}&rating=${n}`;
    return `<td style="padding:0 4px;">
      <a href="${url}" style="display:block;background:#2a2218;padding:14px 16px;text-decoration:none;">
        <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#c9b99a;">★</span>
      </a>
    </td>`;
  }).join('');

  const body = `
    ${hero('Tu estancia en Paraíso Encantado', '¿Cómo fue tu escapada?', 'Tu opinión nos ayuda a crear experiencias cada vez más mágicas.')}
    <tr><td class="mplg" style="background-color:#faf8f5;padding:52px 48px;">
      ${greeting(data.customerName)}
      <p style="margin:16px 0 8px;font-family:'Jost','Helvetica Neue',Arial;font-size:15px;font-weight:300;color:#4a3f30;line-height:1.85;">
        Tu estancia del <strong>${formatDateEs(data.checkin)}</strong> al <strong>${formatDateEs(data.checkout)}</strong> en ${data.habitaciones} terminó hace un día. ¿Cómo fue tu experiencia?
      </p>
      ${divider()}
      <p style="margin:0 0 20px;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#9a8a74;text-align:center;letter-spacing:0.05em;">HAZ CLIC EN LAS ESTRELLAS PARA CALIFICARNOS</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 32px;">
        <tr>${starsHtml}</tr>
      </table>
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-style:italic;color:#5a4e3c;text-align:center;line-height:1.7;margin:0 0 32px;">
        "Cada opinión nos ayuda a hacer de Paraíso Encantado un lugar más mágico<br>para quienes vienen después de ti."
      </p>
      <p style="font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#9a8a74;text-align:center;margin:0;">
        También puedes respondernos directamente a este correo. 🌿
      </p>
    </td></tr>`;
  return wrap(`${first}, ¿cómo fue tu estancia en Paraíso Encantado?`, body);
}

// ── 2. Post-stay +7 días: Invitación Google Maps ───────────────────────────
export function buildReviewEmailHtml(data: {
  customerName: string; confirmacion: string; checkin: string;
}): string {
  const first = data.customerName.trim().split(' ')[0];
  const body = `
    ${hero('Una semana después del paraíso', 'Tu opinión llega más lejos de lo que imaginas.', 'Hace 7 días dejaste Paraíso Encantado. ¿Nos dejas una reseña en Google?')}
    <tr><td class="mplg" style="background-color:#faf8f5;padding:52px 48px;">
      ${greeting(data.customerName)}
      <p style="margin:16px 0 32px;font-family:'Jost','Helvetica Neue',Arial;font-size:15px;font-weight:300;color:#4a3f30;line-height:1.85;">
        Hace una semana te despediste de la selva surreal de Xilitla. Tu opinión en Google ayuda a que otros viajeros encuentren su próximo paraíso — y solo toma 2 minutos. 🙏
      </p>
      ${ctaButton('Dejar mi reseña en Google ★', REVIEW_URL)}
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-style:italic;color:#5a4e3c;text-align:center;line-height:1.7;margin:32px 0 0;">
        "Cada reseña es una historia que llega a quienes todavía no han descubierto Xilitla."
      </p>
    </td></tr>`;
  return wrap(`${first}, ¿nos dejas una reseña en Google?`, body);
}

// ── 3. Post-stay +30 días: Oferta de regreso ──────────────────────────────
export function buildReturnOfferEmailHtml(data: {
  customerName: string; confirmacion: string;
  promoExpiry: string;
}): string {
  const first = data.customerName.trim().split(' ')[0];
  const bookingUrl = `${BASE_URL}/reservar?promo=${PROMO_CODE}`;
  const body = `
    ${hero('Una oferta solo para ti', 'Vuelve cuando quieras.', 'El paraíso te recuerda y tiene algo especial reservado para ti.')}
    <tr><td class="mplg" style="background-color:#faf8f5;padding:52px 48px;">
      ${greeting(data.customerName)}
      <p style="margin:16px 0 32px;font-family:'Jost','Helvetica Neue',Arial;font-size:15px;font-weight:300;color:#4a3f30;line-height:1.85;">
        Han pasado 30 días desde que te fuiste y el paraíso todavía te recuerda. Como agradecimiento por haber confiado en nosotros, te ofrecemos <strong>${PROMO_DISCOUNT} de descuento</strong> en tu próxima estancia.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #c9b99a;background-color:#fdf9f4;margin:0 0 32px;">
        <tr><td style="padding:28px 32px;text-align:center;">
          <p style="margin:0 0 10px;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;">Tu código de descuento exclusivo</p>
          <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:500;color:#2a2218;letter-spacing:4px;">${PROMO_CODE}</p>
          <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#9a8a74;">${PROMO_DISCOUNT} de descuento · Válido hasta el ${data.promoExpiry}</p>
        </td></tr>
      </table>
      <p style="font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#9a8a74;text-align:center;margin:0 0 8px;">
        Aplica en cualquier suite disponible. Menciona el código al reservar por WhatsApp o úsalo en el motor en línea.
      </p>
      ${ctaButton(`Reservar con ${PROMO_DISCOUNT} de descuento`, bookingUrl)}
    </td></tr>`;
  return wrap(`${first}, tu paraíso te espera — ${PROMO_DISCOUNT} de descuento exclusivo`, body);
}

// ── 4. Pre-llegada -3 días: Restaurante ────────────────────────────────────
export function buildRestaurantEmailHtml(data: {
  customerName: string; confirmacion: string;
  checkin: string; checkinFormatted: string;
}): string {
  const first = data.customerName.trim().split(' ')[0];
  const waText = encodeURIComponent(`Hola, quisiera reservar una cena en El Papán Huasteco para el ${data.checkinFormatted}. Mi confirmación es ${data.confirmacion}.`);
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${waText}`;

  const menus = [
    { name: 'Antojitos Mexicanos', desc: 'Sopes, enchiladas, flautas y quesadillas del comal', precio: '$190/persona' },
    { name: 'Tacos de Cecina', desc: '3 tacos en tortilla grande con guarniciones y salsas', precio: '$165/persona' },
    { name: 'Enchiladas Huastecas', desc: 'Tradición huasteca con cecina, frijoles, queso y aguacate', precio: '$210/persona' },
    { name: 'Ensalada Verde con Pollo', desc: 'Fresca y ligera con arándanos y aderezo especial', precio: '$180/persona' },
  ].map(m => `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-bottom:1px solid #e4ddd3;margin-bottom:4px;">
      <tr>
        <td style="padding:16px 0;width:75%;vertical-align:top;">
          <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#2a2218;margin:0 0 4px;">${m.name}</p>
          <p style="font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#9a8a74;margin:0;">${m.desc}</p>
        </td>
        <td style="padding:16px 0 16px 16px;text-align:right;vertical-align:top;white-space:nowrap;">
          <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#2a2218;margin:0;">${m.precio}</p>
        </td>
      </tr>
    </table>`).join('');

  const body = `
    ${hero('Tu cena en la selva', '¿Una cena especial?', 'Restaurante El Papán Huasteco · Paraíso Encantado')}
    <tr><td class="mplg" style="background-color:#faf8f5;padding:52px 48px;">
      ${greeting(data.customerName)}
      <p style="margin:16px 0 32px;font-family:'Jost','Helvetica Neue',Arial;font-size:15px;font-weight:300;color:#4a3f30;line-height:1.85;">
        En <strong>3 días</strong> llegas a Paraíso Encantado. ¿Te gustaría reservar una cena en nuestro restaurante <strong>El Papán Huasteco</strong>? Aquí nuestra selección:
      </p>
      ${menus}
      <p style="font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#9a8a74;margin:16px 0 0;">Incluye aguas frescas, café y pan dulce · Sin costo de reserva</p>
      ${ctaButton('Reservar mi cena por WhatsApp 💬', waUrl, '#2a2218')}
      <p style="font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#9a8a74;text-align:center;margin:0;">
        También puedes llamarnos al +52 489-100-7679
      </p>
    </td></tr>`;
  return wrap(`${first}, ¿una cena especial en El Papán Huasteco?`, body);
}

// ── 5. Pre-llegada día del checkin: Guía de bienvenida ────────────────────
export function buildWelcomeGuideEmailHtml(data: {
  customerName: string; confirmacion: string;
  checkin: string; habitaciones: string;
}): string {
  const first = data.customerName.trim().split(' ')[0];
  const mapsUrl = 'https://maps.google.com/?q=Hotel+Paraíso+Encantado,+Xilitla,+SLP';

  const body = `
    ${hero('Hoy es el día', 'Tu paraíso, hoy.', '¡El momento que esperabas ha llegado! Aquí todo lo que necesitas saber.')}
    <tr><td class="mplg" style="background-color:#faf8f5;padding:52px 48px;">
      ${greeting(data.customerName)}
      <p style="margin:16px 0 32px;font-family:'Jost','Helvetica Neue',Arial;font-size:15px;font-weight:300;color:#4a3f30;line-height:1.85;">
        ¡Hoy es el día! En unas horas estarás rodeado de la selva surreal de Xilitla. Aquí tu guía de llegada.
      </p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #c9b99a;background-color:#fdf9f4;margin:0 0 32px;">
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 8px;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;">Tu confirmación</p>
          <p style="margin:0 0 16px;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#2a2218;">${data.confirmacion}</p>
          <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#4a3f30;">
            🏠 <strong>${data.habitaciones}</strong><br>
            📅 Check-in a partir de las <strong>3:00 PM</strong><br>
            📅 Check-out antes de las <strong>12:00 PM</strong>
          </p>
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f0e8;margin:0 0 32px;">
        <tr>
          <td style="width:50%;padding:20px;vertical-align:top;border-right:1px solid #e4ddd3;border-bottom:1px solid #e4ddd3;">
            <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">📍 Cómo llegar</p>
            <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#4a3f30;line-height:1.5;">
              Camino a las Pozas 10, Xilitla, SLP 79900<br>
              <a href="${mapsUrl}" style="color:#8a6830;text-decoration:underline;">Ver en Google Maps</a>
            </p>
          </td>
          <td style="width:50%;padding:20px;vertical-align:top;border-bottom:1px solid #e4ddd3;">
            <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">🌿 Cerca del hotel</p>
            <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#4a3f30;line-height:1.5;">
              Jardín Surrealista de Edward James<br>
              Cascadas · Pozas naturales · Centro histórico
            </p>
          </td>
        </tr>
        <tr>
          <td style="width:50%;padding:20px;vertical-align:top;border-right:1px solid #e4ddd3;">
            <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">🌊 Tours disponibles</p>
            <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#4a3f30;line-height:1.5;">
              Expedición Tamul · Cascadas del Meco<br>
              Ruta Surrealista · Puente de Dios<br>
              <a href="https://wa.me/${WA_NUMBER}" style="color:#8a6830;text-decoration:underline;">Consultar por WhatsApp</a>
            </p>
          </td>
          <td style="width:50%;padding:20px;vertical-align:top;">
            <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">🍽️ Restaurante</p>
            <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#4a3f30;line-height:1.5;">
              El Papán Huasteco<br>
              Horario: 8:00 AM – 8:00 PM<br>
              Cocina típica huasteca
            </p>
          </td>
        </tr>
      </table>

      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:19px;font-style:italic;color:#5a4e3c;text-align:center;line-height:1.7;margin:0 0 32px;">
        "Te esperamos con los brazos abiertos y el corazón lleno. 🌿"
      </p>
      ${ctaButton('¿Alguna pregunta? Escríbenos por WhatsApp', `https://wa.me/${WA_NUMBER}`)}
    </td></tr>`;
  return wrap(`¡Hoy es el día, ${first}! — Tu suite te espera`, body);
}
