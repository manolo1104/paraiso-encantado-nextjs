'use client';

import { useState, useMemo } from 'react';
import { Search, MessageSquare, X, Loader2 } from 'lucide-react';
import type { GuestProfile } from '@/lib/admin/sheets-admin';
import styles from './clientes.module.css';

const WA = '524891007679';

interface Props { initialClientes: GuestProfile[] }

function ClienteDrawer({ cliente, onClose }: { cliente: GuestProfile; onClose: () => void }) {
  const [notas, setNotas] = useState(cliente.notas || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveNotas() {
    setSaving(true);
    try {
      await fetch('/api/admin/clientes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cliente.email, notas }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  function openWA() {
    const num = cliente.telefono?.replace(/\D/g, '') || WA;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(`Hola ${cliente.nombre.split(' ')[0]}, te contactamos desde Paraíso Encantado 🌿`)}`, '_blank');
  }

  return (
    <div className={styles.drawerOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <div>
            <h2 className={styles.drawerName}>{cliente.nombre}</h2>
            <p className={styles.drawerEmail}>{cliente.email}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.statsGrid}>
            <div className={styles.stat}><span className={styles.statLabel}>Reservas</span><span className={styles.statVal}>{cliente.totalReservas}</span></div>
            <div className={styles.stat}><span className={styles.statLabel}>Total gastado</span><span className={styles.statVal}>${cliente.totalGastado.toLocaleString('es-MX')}</span></div>
            <div className={styles.stat}><span className={styles.statLabel}>Última estancia</span><span className={styles.statVal}>{cliente.ultimaEstancia || '—'}</span></div>
          </div>

          {cliente.telefono && cliente.telefono !== 'N/A' && (
            <div className={styles.contact}>
              <span>{cliente.telefono}</span>
              <button className={styles.waBtn} onClick={openWA}>
                <MessageSquare size={14} /> WhatsApp
              </button>
            </div>
          )}

          {cliente.suitesFavoritas.length > 0 && (
            <div className={styles.suites}>
              <p className={styles.suitesLabel}>Suites reservadas</p>
              <div className={styles.suiteTags}>
                {cliente.suitesFavoritas.map(s => <span key={s} className={styles.suiteTag}>{s}</span>)}
              </div>
            </div>
          )}

          <div className={styles.notasSection}>
            <label className={styles.notasLabel}>Notas internas</label>
            <textarea
              className={styles.notasInput}
              rows={5}
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Preferencias, alergias, ocasiones especiales…"
            />
            <button className={styles.saveBtn} onClick={saveNotas} disabled={saving}>
              {saving ? <Loader2 size={13} className={styles.spin} /> : null}
              {saved ? '✓ Guardado' : 'Guardar notas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientesClient({ initialClientes }: Props) {
  const [clientes] = useState(initialClientes);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GuestProfile | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clientes;
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.telefono.includes(q)
    );
  }, [clientes, search]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Clientes</h1>
          <p className={styles.pageSub}>{clientes.length} huéspedes · ${clientes.reduce((s, c) => s + c.totalGastado, 0).toLocaleString('es-MX')} MXN total</p>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Buscar por nombre, email o teléfono…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Cliente</th><th>Teléfono</th><th>Reservas</th><th>Total gastado</th><th>Última estancia</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className={styles.empty}>Sin clientes que mostrar</td></tr>
            ) : filtered.map(c => (
              <tr key={c.email} className={styles.row} onClick={() => setSelected(c)}>
                <td>
                  <div className={styles.clienteName}>{c.nombre}</div>
                  <div className={styles.clienteEmail}>{c.email}</div>
                </td>
                <td>{c.telefono !== 'N/A' ? c.telefono : '—'}</td>
                <td>{c.totalReservas}</td>
                <td className={styles.total}>${c.totalGastado.toLocaleString('es-MX')}</td>
                <td>{c.ultimaEstancia || '—'}</td>
                <td>
                  {c.notas && <span className={styles.notaBadge} title="Tiene notas">📝</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <ClienteDrawer cliente={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
