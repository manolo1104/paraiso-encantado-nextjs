import { getRedMetricas } from '@/lib/admin/sheets-admin';
import RedesClient from './RedesClient';

export const dynamic = 'force-dynamic';

export default async function RedesPage() {
  const metricas = await getRedMetricas();
  return <RedesClient initialMetricas={metricas} />;
}
