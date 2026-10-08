import { getAjustes, getConfigPrecios, getHistorial, getReglas } from '@/lib/admin/precios-sheets';
import { sumarDias } from '@/lib/precios';
import { construirSenales } from '@/lib/admin/demanda';
import { calcularImpacto } from '@/lib/admin/precios-impacto';
import { mexicoTodayStr } from '@/lib/date-mx';
import PreciosClient from './PreciosClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Precios dinámicos' };

export default async function PreciosPage() {
  const hoy = mexicoTodayStr();
  const [config, reglas, ajustes, historial, senales, impacto] = await Promise.all([
    getConfigPrecios(),
    getReglas(),
    getAjustes(hoy, sumarDias(hoy, 400)),
    getHistorial(60),
    construirSenales(hoy, 120).catch(() => []),
    calcularImpacto(30),
  ]);
  return <PreciosClient initial={{ config, reglas, ajustes, historial, senales, hoy, impacto }} />;
}
