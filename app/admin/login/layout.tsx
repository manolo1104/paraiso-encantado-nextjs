import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — Paraíso Encantado',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
