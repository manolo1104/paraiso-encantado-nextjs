'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Calendar, BookOpen, FileText, TrendingUp, Users, BarChart2, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import styles from './AdminSidebar.module.css';

const NAV = [
  { href: '/admin/calendario',   label: 'Calendario',    icon: Calendar },
  { href: '/admin/reservas',     label: 'Reservas',      icon: BookOpen },
  { href: '/admin/cotizaciones', label: 'Cotizaciones',  icon: FileText },
  { href: '/admin/ingresos',     label: 'Ingresos',      icon: TrendingUp },
  { href: '/admin/clientes',     label: 'Clientes',      icon: Users },
  { href: '/admin/redes',        label: 'Redes Sociales',icon: BarChart2 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <>
      {/* Mobile toggle */}
      <button className={styles.mobileToggle} onClick={() => setOpen(o => !o)} aria-label="Menú">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay mobile */}
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.brand}>
          <p className={styles.brandEye}>Panel Admin</p>
          <p className={styles.brandName}>Paraíso Encantado</p>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className={`${styles.navItem} ${pathname === href ? styles.active : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <button className={styles.logout} onClick={handleLogout}>
          <LogOut size={16} strokeWidth={1.5} />
          <span>Cerrar sesión</span>
        </button>
      </aside>
    </>
  );
}
