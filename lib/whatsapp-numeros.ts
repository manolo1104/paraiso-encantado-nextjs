/**
 * A quién le escribe quien pulsa un botón de WhatsApp.
 *
 * En el sitio del hotel conviven enlaces a `wa.me` de TRES negocios distintos:
 * el hotel, la operadora de tours (Huasteca Potosina Tours) y el restaurante
 * El Papán. El detector global de `components/TrackingSetup.tsx` los veía a
 * todos igual y los mandaba a GTM como el mismo `contacto_whatsapp`, que es la
 * conversión de Google Ads del hotel: la cuenta estaba pagando y aprendiendo
 * con clics de gente que pedía informes de un tour o una mesa para cenar.
 *
 * Los números se repiten literales en ~20 archivos (y así se quedan: tocarlos
 * todos no entra en este cambio). Aquí solo viven para CLASIFICAR el destino.
 */

export const WA_HOTEL = '524891007679';
export const WA_TOURS = '524891090388';
export const WA_RESTAURANTE = '524891255181';

export type NegocioWa = 'hotel' | 'tours' | 'restaurante' | 'otro';

/**
 * El evento interno con el que se registra el clic, según a quién vaya.
 * Solo el del hotel conserva `clic_whatsapp`, que es el que GTM convierte en
 * `contacto_whatsapp`; así los otros dos dejan de contar como conversión sin
 * tener que tocar nada en la cuenta de Google Ads.
 */
const EVENTO_POR_NEGOCIO: Record<NegocioWa, string> = {
  hotel: 'clic_whatsapp',
  tours: 'clic_whatsapp_tours',
  restaurante: 'clic_whatsapp_restaurante',
  otro: 'clic_whatsapp_otro',
};

/**
 * Normaliza un número de WhatsApp a solo dígitos para poder compararlo.
 * Los href del sitio vienen como `wa.me/524891007679`, a veces con `+`,
 * espacios o guiones, y a veces como `api.whatsapp.com/send?phone=…`.
 */
function soloDigitos(numero: string): string {
  return numero.replace(/\D/g, '');
}

export function negocioDeNumero(numero: string | null | undefined): NegocioWa {
  if (!numero) return 'otro';
  const n = soloDigitos(numero);
  if (!n) return 'otro';
  if (n === WA_HOTEL) return 'hotel';
  if (n === WA_TOURS) return 'tours';
  if (n === WA_RESTAURANTE) return 'restaurante';
  return 'otro';
}

export function eventoDeNumeroWa(numero: string | null | undefined): string {
  return EVENTO_POR_NEGOCIO[negocioDeNumero(numero)];
}
