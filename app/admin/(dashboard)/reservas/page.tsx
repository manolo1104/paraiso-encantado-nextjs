import { getAllBookings } from '@/lib/admin/sheets-admin';
import ReservasClient from './ReservasClient';

export const dynamic = 'force-dynamic';

export default async function ReservasPage() {
  const bookings = await getAllBookings();
  return <ReservasClient initialBookings={bookings} />;
}
