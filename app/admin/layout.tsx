import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/admin/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import styles from './admin.module.css';

export const metadata = { title: 'Dashboard · Paraíso Encantado' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) redirect('/admin/login');
  try {
    await verifyToken(token);
  } catch {
    redirect('/admin/login');
  }

  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
