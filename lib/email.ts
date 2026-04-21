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
}): string {
  const base = 'https://www.paraisoencantado.com';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Por confirmar';
    const d = new Date(dateStr + 'T12:00:00');
    const f = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
    return f.charAt(0).toUpperCase() + f.slice(1);
  };

  const adults = Number(data.adults ?? data.guests ?? 0) || 0;
  const minors = Number(data.minors ?? 0) || 0;
  const guestsBreakdown = `${adults} adulto${adults === 1 ? '' : 's'} · ${minors} menor${minors === 1 ? '' : 'es'}`;
  const nights = data.nights || 0;

  const roomsRows = (data.rooms || []).map(room => `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-bottom:1px solid #e4ddd3;">
      <tr>
        <td style="padding:20px 0;vertical-align:top;width:80%;">
          <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:400;color:#2a2218;margin:0 0 4px 0;">${room.name || 'Habitación'}</p>
          <p style="font-size:12px;color:#9a8a74;font-weight:300;margin:0;">${room.guestCount || 1} persona${(room.guestCount || 1) > 1 ? 's' : ''} · ${nights} noche${nights > 1 ? 's' : ''}</p>
        </td>
        <td style="padding:20px 0 20px 20px;text-align:right;vertical-align:top;white-space:nowrap;">
          <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:500;color:#2a2218;margin:0;">$${Number(room.totalPrice || 0).toLocaleString('es-MX')}</p>
        </td>
      </tr>
    </table>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu estadía está confirmada — ${data.confirmationNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
    * { margin:0; padding:0; }
    body { font-family:'Jost','Helvetica Neue',Arial,sans-serif; background-color:#f0ebe3; line-height:1.6; }
    table { border-collapse:collapse; }
    img { display:block; max-width:100%; height:auto; }
    a { color:#2a2218; text-decoration:none; }
    .wrapper { background-color:#f0ebe3; padding:20px 0; }
    .container { max-width:620px; margin:0 auto; background-color:#faf8f5; }
    @media only screen and (max-width:640px) {
      .wrapper { padding:0!important; }
      .container,.full-width { width:100%!important; max-width:100%!important; }
      .mobile-padding { padding-left:24px!important; padding-right:24px!important; }
      .mobile-padding-lg { padding:34px 24px!important; }
      .hero-title { font-size:34px!important; line-height:1.15!important; }
      .split-left { border-left:1px solid #e4ddd3!important; }
      .cta-button { width:100%!important; }
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
    <tr><td align="center" style="padding:0;">
      <table class="container full-width" role="presentation" width="620" cellspacing="0" cellpadding="0" border="0">

        <!-- HERO -->
        <tr><td class="mobile-padding-lg" style="padding:34px 40px 38px 40px;background-color:#2f281f;">
            <p style="margin:0 0 8px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3.5px;text-transform:uppercase;color:rgba(255,255,255,0.72);">Confirmación de Reserva</p>
            <h1 class="hero-title" style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:46px;font-style:italic;font-weight:300;color:#ffffff;line-height:1.1;">Tu paraíso te espera.</h1>
            <p style="margin:14px 0 0 0;font-family:'Jost','Helvetica Neue',Arial;font-size:14px;font-weight:300;color:rgba(255,255,255,0.8);line-height:1.7;">Tu estancia en Hotel Paraíso Encantado ya está lista. Aquí tienes todos los detalles de tu llegada.</p>
          </td>
        </tr>

        <!-- MAIN CARD -->
        <tr><td class="mobile-padding-lg" style="background-color:#faf8f5;padding:52px 48px;">

          <p style="margin:0 0 8px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#2a2218;line-height:1.2;">
            Bienvenido/a,<br><span style="font-style:italic;color:#7a6a52;">${data.customerName}</span>
          </p>

          <p style="margin:24px 0 32px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:15px;font-weight:300;color:#4a3f30;line-height:1.85;">
            Todo está listo. Tu reserva ha sido confirmada y el equipo de Paraíso Encantado ya prepara tu llegada. Pronto estarás despertando con el canto de las aves, rodeado de la selva surreal de Xilitla.
          </p>

          <table role="presentation" width="48" cellspacing="0" cellpadding="0" border="0">
            <tr><td style="height:1px;background-color:#c9b99a;"></td></tr>
          </table>

          <!-- CONFIRMATION NUMBER -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0;">
            <tr><td style="border:1px solid #c9b99a;background-color:#fdf9f4;padding:28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0 0 10px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;">Número de Confirmación</p>
                    <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:500;color:#2a2218;letter-spacing:1px;">${data.confirmationNumber}</p>
                  </td>
                  <td style="vertical-align:middle;text-align:right;width:44px;">
                    <table role="presentation" width="44" height="44" cellspacing="0" cellpadding="0" border="0" style="border:1.5px solid #c9b99a;background-color:#2a2218;border-radius:50%;">
                      <tr><td align="center" style="vertical-align:middle;font-size:24px;color:#faf8f5;height:44px;">✓</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- STAY DETAILS -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0;">
            <tr>
              <td style="width:50%;border:1px solid #e4ddd3;background-color:#faf8f5;padding:22px 24px;vertical-align:top;">
                <p style="margin:0 0 12px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;">Llegada</p>
                <p style="margin:0 0 4px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#2a2218;">${formatDate(data.checkin)}</p>
                <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;color:#9a8a74;">Check-in a partir de las 3:00 PM</p>
              </td>
              <td class="split-left" style="width:50%;border:1px solid #e4ddd3;border-left:none;background-color:#faf8f5;padding:22px 24px;vertical-align:top;">
                <p style="margin:0 0 12px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;">Salida</p>
                <p style="margin:0 0 4px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#2a2218;">${formatDate(data.checkout)}</p>
                <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;color:#9a8a74;">Check-out antes de las 12:00 PM</p>
              </td>
            </tr>
            <tr>
              <td style="width:50%;border:1px solid #e4ddd3;border-top:none;background-color:#faf8f5;padding:22px 24px;vertical-align:top;">
                <p style="margin:0 0 12px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;">Duración</p>
                <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#2a2218;">${nights} noche${nights === 1 ? '' : 's'}</p>
              </td>
              <td class="split-left" style="width:50%;border:1px solid #e4ddd3;border-top:none;border-left:none;background-color:#faf8f5;padding:22px 24px;vertical-align:top;">
                <p style="margin:0 0 12px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9a8a74;">Huéspedes</p>
                <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#2a2218;">${guestsBreakdown}</p>
              </td>
            </tr>
          </table>

          <!-- ROOMS -->
          <p style="margin:32px 0 20px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:3.5px;text-transform:uppercase;color:#9a8a74;">Habitaciones Reservadas</p>
          ${roomsRows}

          <!-- TOTAL -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#2a2218;margin:32px 0;">
            <tr><td class="mobile-padding" style="padding:24px 48px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td><p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9b99a;">Total Pagado</p></td>
                  <td style="text-align:right;">
                    <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#faf8f5;">
                      $${Number(data.total || 0).toLocaleString('es-MX')}<span style="font-size:14px;color:#c9b99a;"> MXN</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- QUOTE -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-left:2px solid #c9b99a;padding-left:24px;margin:32px 0;">
            <tr><td>
              <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:19px;font-style:italic;font-weight:300;color:#5a4e3c;line-height:1.7;">
                "En Paraíso Encantado, cada amanecer es una obra de arte que la selva pinta para ti. Te esperamos con los brazos abiertos y el corazón lleno."
              </p>
            </td></tr>
          </table>

          <!-- ARRIVAL INFO -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f0e8;margin:32px 0 0 0;">
            <tr>
              <td style="width:50%;padding:20px;vertical-align:top;">
                <p style="margin:0 0 8px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">🚗 Cómo Llegar</p>
                <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#4a3f30;line-height:1.5;">A 7 min del centro. Paraíso Encantado, Xilitla, SLP 79910.</p>
              </td>
              <td class="split-left" style="width:50%;padding:20px;vertical-align:top;border-left:1px solid #e4ddd3;">
                <p style="margin:0 0 8px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">🌿 Cerca de Ti</p>
                <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#4a3f30;line-height:1.5;">A pasos del Jardín Surrealista de Edward James.</p>
              </td>
            </tr>
            <tr>
              <td style="width:50%;padding:20px;vertical-align:top;border-top:1px solid #e4ddd3;">
                <p style="margin:0 0 8px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">📞 Contacto Directo</p>
                <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#4a3f30;"><a href="tel:+524891007679" style="color:#2a2218;border-bottom:1px solid #c9b99a;">489-100-7679</a></p>
              </td>
              <td class="split-left" style="width:50%;padding:20px;vertical-align:top;border-top:1px solid #e4ddd3;border-left:1px solid #e4ddd3;">
                <p style="margin:0 0 8px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;color:#2a2218;">🆔 Al Llegar</p>
                <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#4a3f30;">Presenta: <strong>${data.confirmationNumber}</strong></p>
              </td>
            </tr>
          </table>

        </td></tr>

        <!-- CTA -->
        <tr><td class="mobile-padding-lg" style="background-color:#f4f0e8;padding:44px 48px;text-align:center;">
          <p style="margin:0 0 12px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;">Antes de tu Llegada</p>
          <h2 style="margin:0 0 24px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-style:italic;font-weight:300;color:#2a2218;">Descubre todo lo que puedes vivir en Xilitla.</h2>
          <table class="cta-button" role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
            <tr><td style="background-color:#2a2218;padding:16px 38px;">
              <a href="${base}" style="font-family:'Jost','Helvetica Neue',Arial;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#faf8f5;text-decoration:none;display:block;">Explorar la Huasteca</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- CONTACT -->
        <tr><td class="mobile-padding" style="background-color:#faf8f5;padding:32px 48px;border-top:1px solid #e4ddd3;">
          <p style="margin:0 0 16px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a8a74;">¿Tienes Preguntas?</p>
          <p style="margin:0 0 8px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#2a2218;">
            📧 <a href="mailto:reservas@paraisoencantado.com" style="color:#2a2218;border-bottom:1px solid #c9b99a;">reservas@paraisoencantado.com</a>
          </p>
          <p style="margin:0 0 12px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:13px;color:#2a2218;">
            📞 <a href="tel:+524891007679" style="color:#2a2218;">489-100-7679</a>
          </p>
          <p style="margin:0;font-family:'Jost','Helvetica Neue',Arial;font-size:12px;color:#9a8a74;">ID de Pago: ${data.paymentIntentId || 'N/A'}</p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td class="mobile-padding-lg" style="background-color:#f0ebe3;padding:44px 48px;text-align:center;">
          <p style="margin:0 0 12px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;letter-spacing:3px;text-transform:uppercase;color:#8a7d6b;">Paraíso Encantado</p>
          <p style="margin:0 0 16px 0;font-family:'Jost','Helvetica Neue',Arial;font-size:11px;color:#a09080;line-height:1.6;">
            Hotel Paraíso Encantado &middot; Xilitla, San Luis Potosí 79910 &middot; México<br>
            A pasos del Jardín Surrealista de Edward James
          </p>
          <p style="margin:16px 0 0 0;font-family:'Jost','Helvetica Neue',Arial;font-size:10px;color:#b8aa9a;">
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
