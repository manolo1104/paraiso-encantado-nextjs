import type { Metadata } from 'next';
import AdminSidebar from '@/components/admin/AdminSidebar';
import styles from './admin.module.css';

export const metadata: Metadata = {
  title: 'Dashboard · Paraíso Encantado',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

// La protección de rutas la maneja el middleware (middleware.ts)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
