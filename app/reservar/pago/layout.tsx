// Paso 3 de la reserva (pago) — noindex/nofollow, igual que el paso 2.
//
// Aparte de sacarlo de Google, esto le da título propio: hasta ahora heredaba
// el de /reservar, así que en GA4 el paso 1 y el paso 3 caían en la misma fila
// y la fuga más grande del embudo (de /reservar al checkout) era imposible de
// ubicar. Sin título distinto no hay forma de saber dónde se pierde la gente.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pago | Paraíso Encantado',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function PagoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
