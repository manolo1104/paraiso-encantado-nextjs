// Checkout — noindex/nofollow. Las páginas de pago no deben indexarse en Google:
// pueden exponer estados de sesión, duplicar contenido y confundir crawlers.
// Estándar de la industria: Marriott, Booking.com, Expedia — todas noindex en checkout.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finalizar Reserva | Paraíso Encantado',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
