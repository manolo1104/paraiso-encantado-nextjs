/**
 * bank-info.js
 * Datos bancarios para el anticipo (SPEI / OXXO). Una sola fuente: la cotización,
 * el resumen al cliente y el registro en reservations.json dicen lo mismo.
 * Se leen de las variables BANK_* en cada llamada (sin caché) para que un cambio
 * de variable en Railway aplique sin tocar código.
 */

export function getBankInfo() {
  return {
    banco:     process.env.BANK_NAME     || 'Banamex',
    titular:   process.env.BANK_TITULAR  || 'Mario Arturo Covarrubias Orduña',
    clabe:     process.env.BANK_CLABE    || '002705700824116647',
    cuenta:    process.env.BANK_CUENTA   || '4217470058780996',
  };
}
