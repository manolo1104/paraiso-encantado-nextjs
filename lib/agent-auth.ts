import { createHash, timingSafeEqual } from 'crypto';

/**
 * ¿La petición viene del bot de WhatsApp (Camila)?
 *
 * El bot se autentica con el token compartido AGENT_API_TOKEN, en el header
 * `x-agent-token` (el mismo que ya usa middleware.ts para las rutas admin) o en
 * `Authorization: Bearer <token>`.
 *
 * La comparación es en tiempo constante: se comparan los sha256 de ambos lados,
 * que siempre miden 32 bytes, así timingSafeEqual no lanza por largos distintos
 * y el tiempo no revela cuántos caracteres coinciden.
 *
 * Solo para rutas con runtime Node (usa node:crypto). Sin AGENT_API_TOKEN
 * configurado (o vacío) nadie es agente: fail-closed.
 */
export function isAgentRequest(req: Request): boolean {
  const expected = process.env.AGENT_API_TOKEN;
  if (!expected) return false;

  const candidates: string[] = [];
  const headerToken = req.headers.get('x-agent-token');
  if (headerToken) candidates.push(headerToken.trim());
  const auth = req.headers.get('authorization');
  const bearer = auth?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) candidates.push(bearer);

  const expectedHash = sha256(expected);
  // Se evalúan todos los candidatos (sin cortar al primero) por la misma razón.
  let ok = false;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (timingSafeEqual(sha256(candidate), expectedHash)) ok = true;
  }
  return ok;
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}
