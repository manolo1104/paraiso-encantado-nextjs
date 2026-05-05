import AdminSidebar from '@/components/admin/AdminSidebar';
import styles from './admin.module.css';

export const metadata = { title: 'Dashboard · Paraíso Encantado' };

// La protección de rutas la maneja el middleware (middleware.ts)
// No redirigir aquí para evitar loop infinito en /admin/login
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
