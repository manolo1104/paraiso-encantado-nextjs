// Confirmación — noindex. Página transaccional post-pago, no debe indexarse.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reserva Confirmada | Paraíso Encantado',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ConfirmacionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
