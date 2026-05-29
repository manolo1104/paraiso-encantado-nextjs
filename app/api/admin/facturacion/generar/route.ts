import { NextRequest, NextResponse } from 'next/server';
import { buildCfdiPayload, createCfdi, facturamaConfigured, FacturamaError, RECEPTOR_PUBLICO, type CfdiReceiver } from '@/lib/admin/facturama';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!facturamaConfigured()) {
    return NextResponse.json(
      { error: 'La facturación no está configurada (faltan las credenciales de Facturama).' },
      { status: 503 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const total = Number(body?.total);
  if (!total || total <= 0) {
    return NextResponse.json({ error: 'El monto a facturar es inválido.' }, { status: 400 });
  }

  const descripcion: string =
    (typeof body?.descripcion === 'string' && body.descripcion.trim()) ||
    'Servicio de hospedaje';

  // Receptor: si no mandan RFC, factura a público en general.
  const r = body?.receiver || {};
  const receiver: CfdiReceiver = r?.Rfc
    ? {
        Rfc: String(r.Rfc),
        Name: String(r.Name || ''),
        CfdiUse: String(r.CfdiUse || 'G03'),
        FiscalRegime: String(r.FiscalRegime || '601'),
        TaxZipCode: String(r.TaxZipCode || ''),
      }
    : RECEPTOR_PUBLICO;

  // Validación mínima para receptor con RFC.
  if (r?.Rfc) {
    if (!receiver.Name) return NextResponse.json({ error: 'Falta la razón social del receptor.' }, { status: 400 });
    if (!receiver.TaxZipCode) return NextResponse.json({ error: 'Falta el código postal del receptor.' }, { status: 400 });
  }

  const payload = buildCfdiPayload({
    total,
    descripcion,
    receiver,
    paymentForm: body?.paymentForm,
    paymentMethod: body?.paymentMethod,
  });

  try {
    const result = await createCfdi(payload);
    return NextResponse.json({
      ok: true,
      id: result.id,
      uuid: result.uuid,
      folio: result.folio,
      serie: result.serie,
      total: result.total,
      fecha: result.fecha,
    });
  } catch (e) {
    if (e instanceof FacturamaError) {
      console.error('[facturacion/generar] Facturama error', e.status, JSON.stringify(e.detail));
      // El detalle del PAC suele traer el motivo exacto (RFC inválido, CP, etc.)
      const detail = typeof e.detail === 'string'
        ? e.detail
        : (e.detail as any)?.Message || (e.detail as any)?.ModelState || e.detail;
      return NextResponse.json(
        { error: 'El PAC rechazó la factura.', status: e.status, detail },
        { status: 502 },
      );
    }
    console.error('[facturacion/generar] Error inesperado', e);
    return NextResponse.json({ error: 'Error inesperado al generar la factura.' }, { status: 500 });
  }
}
