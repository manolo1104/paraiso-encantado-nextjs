import { getAllBookings, buildCRM } from '@/lib/admin/sheets-admin';
import ClientesClient from './ClientesClient';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const bookings = await getAllBookings();
  const crm = await buildCRM(bookings);
  return <ClientesClient initialClientes={crm} />;
}
