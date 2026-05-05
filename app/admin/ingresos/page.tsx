import { getAllBookings } from '@/lib/admin/sheets-admin';
import { calcKPIs } from '@/lib/admin/kpis';
import IngresosClient from './IngresosClient';

export const dynamic = 'force-dynamic';

export default async function IngresosPage() {
  const bookings = await getAllBookings();
  const kpis = calcKPIs(bookings);
  return <IngresosClient kpis={kpis} />;
}
