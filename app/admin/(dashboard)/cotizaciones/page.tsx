import { getAllQuotes } from '@/lib/admin/sheets-admin';
import CotizacionesClient from './CotizacionesClient';

export const dynamic = 'force-dynamic';

export default async function CotizacionesPage() {
  const quotes = await getAllQuotes();
  return <CotizacionesClient initialQuotes={quotes} />;
}
