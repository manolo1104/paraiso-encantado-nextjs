/**
 * ID de la sesión de apartado, compartido por /reservar y /reservar/checkout.
 *
 * Importa que sea EL MISMO en las dos páginas: el motor excluye los apartados
 * de la propia sesión al consultar disponibilidad. Si el ID cambia a media
 * reserva, el huésped ve su propia suite como "no disponible" hasta que el
 * apartado vence (10 min).
 *
 * Antes vivía sólo en `sessionStorage`, y cada página lo leía por su cuenta con
 * un `catch` que generaba uno nuevo. En Safari con almacenamiento bloqueado
 * (modo privado, "prevenir rastreo") eso daba un ID distinto por página.
 * Ahora: memoria del módulo → sessionStorage → localStorage, en ese orden.
 */
const KEY = 'pe_hold_session';

let memoized = '';

function newId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getHoldSessionId(): string {
  if (memoized) return memoized;
  if (typeof window === 'undefined') return '';

  let id = '';
  try { id = sessionStorage.getItem(KEY) || ''; } catch { /* bloqueado */ }
  if (!id) {
    try { id = localStorage.getItem(KEY) || ''; } catch { /* bloqueado */ }
  }
  if (!id) id = newId();

  try { sessionStorage.setItem(KEY, id); } catch { /* bloqueado */ }
  try { localStorage.setItem(KEY, id); } catch { /* bloqueado */ }

  memoized = id;
  return id;
}
