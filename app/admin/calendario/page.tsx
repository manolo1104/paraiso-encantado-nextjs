import { getAllBookings } from '@/lib/admin/sheets-admin';
import CalendarioClient from './CalendarioClient';

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const bookings = await getAllBookings();
  return <CalendarioClient initialBookings={bookings} />;
}
