/**
 * room-names.ts
 * Normalización canónica de nombres de habitación, compartida por el admin
 * (calendario, room-status, iCal). Antes cada punto comparaba a su manera y
 * reservas con variantes ("Suite Jungla (2 personas)", "Flor de Lis 1") no se
 * pintaban ni bloqueaban → cuartos ocupados parecían libres.
 */

// Alias de variantes conocidas → nombre canónico (mismos que lib/sheets.ts).
const ALIASES: Record<string, string> = {
  'suite jungla': 'Jungla',
  'jungla': 'Jungla',
  'suite flor de lis 1': 'Suite Flor de Liz 1',
  'suite flor de lis 2': 'Suite Flor de Liz 2',
  'flor de lis 1': 'Suite Flor de Liz 1',
  'flor de lis 2': 'Suite Flor de Liz 2',
  'flor de liz 1': 'Suite Flor de Liz 1',
  'flor de liz 2': 'Suite Flor de Liz 2',
  'suite flor de liz 1': 'Suite Flor de Liz 1',
  'suite flor de liz 2': 'Suite Flor de Liz 2',
  'orquideas 2': 'Orquídeas 2',
  'orquideas 3': 'Orquídeas 3',
  'orquideas doble': 'Orquídeas Doble',
  'helechos i': 'Helechos 1',
  'helechos ii': 'Helechos 2',
};

/** Quita el sufijo "(2 personas)", espacios extra y normaliza acentos/caso para comparar. */
function keyOf(name: string): string {
  return String(name)
    .replace(/\s*\([^)]*\)/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nombre canónico de una habitación individual (aplica alias y limpia sufijos). */
export function canonicalRoomName(name: string): string {
  const k = keyOf(name);
  return ALIASES[k] || String(name).replace(/\s*\([^)]*\)/g, '').trim();
}

/** Clave estable para comparar dos nombres de habitación (ignora variantes). */
export function roomKey(name: string): string {
  return keyOf(canonicalRoomName(name));
}

/** Separa un CSV de habitaciones ("Jungla (2p), Lirios 1") en nombres canónicos. */
export function splitRooms(habitaciones: string): string[] {
  if (!habitaciones) return [];
  return habitaciones
    .split(',')
    .map(s => canonicalRoomName(s))
    .filter(Boolean);
}
