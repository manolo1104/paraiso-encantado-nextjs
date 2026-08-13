import type { Metadata } from 'next';
import EncuestaClient from './EncuestaClient';
import styles from './encuesta.module.css';

export const metadata: Metadata = {
  title: 'Tu opinión · Hotel Paraíso Encantado',
  // Es una página privada de encuesta: no debe aparecer en buscadores.
  robots: { index: false, follow: false },
};

export default async function EncuestaPage({
  searchParams,
}: {
  searchParams: Promise<{ conf?: string; r?: string; rating?: string }>;
}) {
  const params = await searchParams;
  const conf = (params.conf || '').trim().slice(0, 40);
  const raw = parseInt(params.r || params.rating || '0', 10);
  const ratingInicial = raw >= 1 && raw <= 5 ? raw : 0;

  return (
    <main className={styles.main}>
      <EncuestaClient conf={conf} ratingInicial={ratingInicial} />
    </main>
  );
}
