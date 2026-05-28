import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

function resolveSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET;
  if (s) return new TextEncoder().encode(s);
  // Fail-closed en producción: no usar un secreto público conocido.
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ ADMIN_JWT_SECRET no configurado en producción — admin deshabilitado (fail-closed)');
    return new TextEncoder().encode('disabled-' + crypto.randomUUID());
  }
  return new TextEncoder().encode('paraiso-encantado-admin-secret-dev-only');
}

const secret = resolveSecret();

export async function createToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export async function checkPassword(plain: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return bcrypt.compare(plain, hash);

  const plainEnv = process.env.ADMIN_PASSWORD;
  if (plainEnv) return plain === plainEnv;

  // En producción, sin contraseña configurada → rechazar (no usar default público).
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ ADMIN_PASSWORD/ADMIN_PASSWORD_HASH no configurada en producción — login deshabilitado');
    return false;
  }
  // Solo desarrollo
  return plain === 'paraiso2024';
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
