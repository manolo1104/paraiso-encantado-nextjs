'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Calendar, BookOpen, FileText, TrendingUp, Users, BarChart2, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  const [botEnabled, setBotEnabled] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch('/api/admin/bot-status')
      .then(r => r.json())
      .then(d => setBotEnabled(d.enabled))
      .catch(() => setBotEnabled(true));
  }, []);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  async function toggleBot() {
    if (toggling || botEnabled === null) return;
    setToggling(true);
    const next = !botEnabled;
    try {
      const res = await fetch('/api/admin/bot-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) setBotEnabled(next);
    } finally {
      setToggling(false);
    }
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

        {/* Toggle Bot WhatsApp */}
        <div className={styles.botToggle}>
          <div className={styles.botToggleInfo}>
            <span className={styles.botToggleLabel}>Bot WhatsApp</span>
            <span className={`${styles.botToggleDot} ${botEnabled ? styles.botOn : styles.botOff}`} />
            <span className={styles.botToggleStatus}>
              {botEnabled === null ? '...' : botEnabled ? 'Activo' : 'Pausado'}
            </span>
          </div>
          <button
            className={`${styles.botToggleBtn} ${botEnabled ? styles.botToggleBtnOn : styles.botToggleBtnOff}`}
            onClick={toggleBot}
            disabled={toggling || botEnabled === null}
            title={botEnabled ? 'Pausar bot' : 'Activar bot'}
          >
            {toggling ? '...' : botEnabled ? 'Pausar' : 'Activar'}
          </button>
        </div>

        <button className={styles.logout} onClick={handleLogout}>
          <LogOut size={16} strokeWidth={1.5} />
          <span>Cerrar sesión</span>
        </button>
      </aside>
    </>
  );
}
