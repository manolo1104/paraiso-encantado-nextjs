import { getAllBookings } from '@/lib/admin/sheets-admin';
import { facturamaConfigured, facturamaIsSandbox } from '@/lib/admin/facturama';
import FacturacionClient from './FacturacionClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Facturación / CFDI — Paraíso Encantado Admin' };

export default async function FacturacionPage() {
  const bookings = await getAllBookings();
  // Solo reservas facturables: confirmadas/manuales con monto. Ordenar por
  // check-in DESC para mostrar las MÁS RECIENTES (antes .slice(0,100) sobre el
  // orden de inserción dejaba fuera las nuevas justo las que se van a facturar).
  const facturables = bookings
    .filter((b) => b.estado !== 'CANCELADA' && b.total > 0)
    .sort((a, b) => (b.checkin || '').localeCompare(a.checkin || ''))
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
