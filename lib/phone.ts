/**
 * phone.ts — Normalización de teléfonos mexicanos para enlaces wa.me.
 * Devuelve solo dígitos con lada país (52), o '' si no hay un número usable.
 * Antes se usaba el número tal cual (10 dígitos → wa.me sin país = inválido) y
 * el fallback caía en el propio número del hotel (el hotel se escribía a sí mismo).
 */
export function normalizeMxPhone(raw: string | null | undefined): string {
  const d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10) return `52${d}`;            // 4891234567 → 524891234567
  if (d.length === 12 && d.startsWith('52')) return d;
  if (d.length === 13 && d.startsWith('521')) return d; // móvil con el 1
  if (d.length >= 11 && d.length <= 15) return d;  // ya trae lada de otro país
  return '';                                        // demasiado corto → no usable
}
