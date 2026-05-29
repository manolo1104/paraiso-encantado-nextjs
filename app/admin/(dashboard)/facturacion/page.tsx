import { getAllBookings } from '@/lib/admin/sheets-admin';
import { facturamaConfigured, facturamaIsSandbox } from '@/lib/admin/facturama';
import FacturacionClient from './FacturacionClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Facturación / CFDI — Paraíso Encantado Admin' };

export default async function FacturacionPage() {
  const bookings = await getAllBookings();
  // Solo reservas facturables: confirmadas/manuales con monto.
  const facturables = bookings
    .filter((b) => b.estado !== 'CANCELADA' && b.total > 0)
    .slice(0, 100);

  return (
    <FacturacionClient
      bookings={facturables}
      facturama={{
        configured: facturamaConfigured(),
        sandbox: facturamaIsSandbox(),
      }}
    />
  );
}
