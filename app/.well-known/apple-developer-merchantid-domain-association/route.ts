import { NextResponse } from 'next/server';

// Dinámica a propósito: con 'force-static' el archivo se generaba al COMPILAR y,
// si Railway no pasaba la variable al build, quedaba un 404 fijo hasta el
// siguiente despliegue (pasó el 12 oct 2026). Así se lee en cada visita.
export const dynamic = 'force-dynamic';

/**
 * Apple Pay domain verification.
 *
 * SETUP STEPS (one-time, done in Stripe Dashboard):
 * 1. Go to stripe.com/dashboard → Settings → Payment methods → Apple Pay
 * 2. Click "Add new domain" → enter "paraisoencantado.com"
 * 3. Download the domain association file Stripe provides
 * 4. Paste its EXACT content into the APPLE_PAY_DOMAIN_ASSOC env var on Railway
 *
 * This route serves that file so Apple can verify the domain.
 */
export async function GET() {
  const fileContent = process.env.APPLE_PAY_DOMAIN_ASSOC;

  if (!fileContent) {
    return new NextResponse('Apple Pay domain association file not configured', { status: 404 });
  }

  return new NextResponse(fileContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
