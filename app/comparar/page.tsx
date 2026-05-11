import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, X as XIcon, ArrowLeft } from 'lucide-react';
import { suites } from '@/data/suites';
import { mxnToUsd } from '@/lib/config';
import styles from './comparar.module.css';

export const metadata = {
  title: 'Comparar Suites | Hotel Paraíso Encantado · Xilitla',
  description: 'Compara las suites de Paraíso Encantado lado a lado para elegir la perfecta para tu escapada.',
};

interface Row {
  label: string;
  key: (s: ReturnType<typeof suites[0]['features']['filter']>[0] extends never ? never : typeof suites[0]) => string | boolean | null;
  highlight?: 'low' | 'high' | 'bool';
}

const ROWS: {
  label: string;
  getValue: (s: (typeof suites)[0]) => string | boolean | null;
  highlight?: 'low' | 'high' | 'bool';
}[] = [
  { label: 'Precio 2 personas', getValue: (s) => `$${s.priceTiers[2].toLocaleString('es-MX')} MXN`, highlight: 'low' },
  { label: 'Precio 3-4 personas', getValue: (s) => s.priceTiers[3] ? `$${s.priceTiers[3].toLocaleString('es-MX')} MXN` : '—', highlight: 'low' },
  { label: 'Capacidad máxima', getValue: (s) => `${s.maxOccupancy} personas`, highlight: 'high' },
  { label: 'Categoría', getValue: (s) => s.category },
  { label: 'Piscina / Spa privado', getValue: (s) => s.features.some(f => f.toLowerCase().includes('piscina') || f.toLowerCase().includes('spa')), highlight: 'bool' },
  { label: 'Tina de hidromasaje', getValue: (s) => s.features.some(f => f.toLowerCase().includes('hidromasaje') || f.toLowerCase().includes('tina')), highlight: 'bool' },
  { label: 'Cama kingsize', getValue: (s) => s.features.some(f => f.toLowerCase().includes('king')), highlight: 'bool' },
  { label: 'Terraza privada', getValue: (s) => s.features.some(f => f.toLowerCase().includes('terraza')), highlight: 'bool' },
  { label: 'Vista panorámica', getValue: (s) => s.features.some(f => f.toLowerCase().includes('vista') || f.toLowerCase().includes('panorám')), highlight: 'bool' },
  { label: 'Sala de estar', getValue: (s) => s.features.some(f => f.toLowerCase().includes('sala')), highlight: 'bool' },
  { label: 'Acceso directo a piscina', getValue: (s) => s.features.some(f => f.toLowerCase().includes('acceso') && f.toLowerCase().includes('piscina')), highlight: 'bool' },
  { label: 'Aire acondicionado', getValue: (s) => s.features.some(f => f.toLowerCase().includes('aire') || f.toLowerCase().includes('a/c')), highlight: 'bool' },
  { label: 'WiFi', getValue: (s) => s.features.some(f => f.toLowerCase().includes('wifi')), highlight: 'bool' },
];

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const rawIds = params.ids?.split(',').filter(Boolean) ?? [];
  const selectedSuites = rawIds
    .map((id) => suites.find((s) => s.id === id))
    .filter(Boolean) as (typeof suites)[0][];

  if (selectedSuites.length < 2) {
    return (
      <main className={styles.main}>
        <div className={styles.empty}>
          <p>Selecciona al menos 2 suites desde la página de habitaciones para comparar.</p>
          <Link href="/habitaciones" className={styles.backBtn}>
            <ArrowLeft size={15} strokeWidth={1.5} /> Ver todas las suites
          </Link>
        </div>
      </main>
    );
  }

  // Para celdas numéricas de precio: detectar el más bajo
  const prices2 = selectedSuites.map((s) => s.priceTiers[2]);
  const minPrice2 = Math.min(...prices2);
  const maxOcc = selectedSuites.map((s) => s.maxOccupancy);
  const maxMaxOcc = Math.max(...maxOcc);

  function isBest(suite: (typeof suites)[0], row: typeof ROWS[0]): boolean {
    if (row.highlight === 'low') {
      if (row.label.includes('2 personas')) return suite.priceTiers[2] === minPrice2;
    }
    if (row.highlight === 'high') {
      if (row.label.includes('Capacidad')) return suite.maxOccupancy === maxMaxOcc;
    }
    return false;
  }

  const cols = selectedSuites.length;

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <Link href="/habitaciones" className={styles.backLink}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Volver a Habitaciones
        </Link>
        <h1 className={styles.title}>Comparar <em>Suites</em></h1>
        <p className={styles.subtitle}>
          {cols} suites seleccionadas · <Link href="/habitaciones">Cambiar selección</Link>
        </p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} style={{ '--cols': cols } as React.CSSProperties}>
          <thead>
            <tr>
              <th className={styles.labelCol} scope="col" aria-label="Atributo" />
              {selectedSuites.map((suite) => (
                <th key={suite.id} className={styles.suiteCol} scope="col">
                  <div className={styles.suiteHeader}>
                    <div className={styles.suiteHeaderImg}>
                      <Image
                        src={suite.images[0]}
                        alt={suite.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className={styles.suiteHeaderImgEl}
                      />
                    </div>
                    <span className={styles.suiteHeaderName}>{suite.name}</span>
                    <span className={styles.suiteHeaderCat}>{suite.category}</span>
                    <Link
                      href={`/reservar?suiteId=${suite.id}&autoselect=1`}
                      className={styles.suiteHeaderCta}
                    >
                      Reservar esta suite
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className={styles.row}>
                <td className={styles.labelCell}>{row.label}</td>
                {selectedSuites.map((suite) => {
                  const value = row.getValue(suite);
                  const best = isBest(suite, row);
                  const isBool = typeof value === 'boolean';

                  return (
                    <td
                      key={suite.id}
                      className={`${styles.valueCell} ${best ? styles.valueCellBest : ''} ${isBool && value ? styles.valueCellTrue : ''} ${isBool && !value ? styles.valueCellFalse : ''}`}
                    >
                      {isBool ? (
                        value ? (
                          <span className={styles.checkYes} aria-label="Sí">
                            <CheckCircle size={16} strokeWidth={2} />
                          </span>
                        ) : (
                          <span className={styles.checkNo} aria-label="No">
                            <XIcon size={16} strokeWidth={2} />
                          </span>
                        )
                      ) : (
                        <span>
                          {best && <span className={styles.bestBadge}>Mejor</span>}
                          {value as string}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CTAs al pie */}
      <div className={styles.footerCtas}>
        {selectedSuites.map((suite) => (
          <div key={suite.id} className={styles.footerCard}>
            <span className={styles.footerCardName}>{suite.name}</span>
            <span className={styles.footerCardPrice}>
              Desde ${suite.price.toLocaleString('es-MX')} MXN
              <em> (~${mxnToUsd(suite.price)} USD)</em>
            </span>
            <Link
              href={`/habitaciones/${suite.id}`}
              className={styles.footerCardDetail}
            >
              Ver detalles completos
            </Link>
            <Link
              href={`/reservar?suiteId=${suite.id}&autoselect=1`}
              className={styles.footerCardCta}
            >
              Reservar {suite.name}
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
