'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Loader2 } from 'lucide-react';
import type { RedMetrica } from '@/lib/admin/sheets-admin';
import styles from './redes.module.css';

interface Props { initialMetricas: RedMetrica[] }

const EMPTY = { ig_seguidores: 0, ig_alcance: 0, ig_interacciones: 0, fb_seguidores: 0, fb_alcance: 0, notas: '' };

export default function RedesClient({ initialMetricas }: Props) {
  const [metricas, setMetricas] = useState(initialMetricas);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/admin/redes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const res = await fetch('/api/admin/redes');
      if (res.ok) setMetricas(await res.json());
      setShowForm(false);
      setForm(EMPTY);
    } finally { setLoading(false); }
  }

  const last = metricas[0];
  const chartData = [...metricas].reverse().slice(-12);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Redes Sociales</h1>
          <p className={styles.pageSub}>Métricas manuales · {metricas.length} registros</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowForm(s => !s)}>
          <Plus size={16} /> Registrar métricas
        </button>
      </div>

      {/* Formulario de ingreso */}
      {showForm && (
        <form onSubmit={handleSave} className={styles.formCard}>
          <h2 className={styles.formTitle}>Nuevas métricas de hoy</h2>
          <div className={styles.formGrid}>
            <label className={styles.field}><span>IG — Seguidores</span><input type="number" min={0} value={form.ig_seguidores} onChange={e => set('ig_seguidores', parseInt(e.target.value))} /></label>
            <label className={styles.field}><span>IG — Alcance semanal</span><input type="number" min={0} value={form.ig_alcance} onChange={e => set('ig_alcance', parseInt(e.target.value))} /></label>
            <label className={styles.field}><span>IG — Interacciones</span><input type="number" min={0} value={form.ig_interacciones} onChange={e => set('ig_interacciones', parseInt(e.target.value))} /></label>
            <label className={styles.field}><span>FB — Seguidores</span><input type="number" min={0} value={form.fb_seguidores} onChange={e => set('fb_seguidores', parseInt(e.target.value))} /></label>
            <label className={styles.field}><span>FB — Alcance semanal</span><input type="number" min={0} value={form.fb_alcance} onChange={e => set('fb_alcance', parseInt(e.target.value))} /></label>
          </div>
          <label className={styles.field}><span>Notas (mejores posts, campañas…)</span><textarea rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} /></label>
          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryBtn} onClick={() => setShowForm(false)}>Cancelar</button>
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? <Loader2 size={14} /> : null} Guardar
            </button>
          </div>
        </form>
      )}

      {/* Últimas métricas */}
      {last && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}><p className={styles.kpiLabel}>IG Seguidores</p><p className={styles.kpiValue}>{last.ig_seguidores.toLocaleString()}</p></div>
          <div className={styles.kpiCard}><p className={styles.kpiLabel}>IG Alcance</p><p className={styles.kpiValue}>{last.ig_alcance.toLocaleString()}</p></div>
          <div className={styles.kpiCard}><p className={styles.kpiLabel}>IG Interacciones</p><p className={styles.kpiValue}>{last.ig_interacciones.toLocaleString()}</p></div>
          <div className={styles.kpiCard}><p className={styles.kpiLabel}>FB Seguidores</p><p className={styles.kpiValue}>{last.fb_seguidores.toLocaleString()}</p></div>
          <div className={styles.kpiCard}><p className={styles.kpiLabel}>FB Alcance</p><p className={styles.kpiValue}>{last.fb_alcance.toLocaleString()}</p></div>
        </div>
      )}

      {/* Gráfica evolución */}
      {chartData.length > 1 && (
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Evolución de seguidores</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4ddd3" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#624820' }} />
              <YAxis tick={{ fontSize: 11, fill: '#624820' }} />
              <Tooltip contentStyle={{ background: '#faf8f5', border: '1px solid #e4ddd3', borderRadius: 6, fontSize: 13 }} />
              <Legend />
              <Line type="monotone" dataKey="ig_seguidores" name="IG Seguidores" stroke="#c9484a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fb_seguidores" name="FB Seguidores" stroke="#2e6b8a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Historial */}
      {metricas.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Fecha</th><th>IG Seg.</th><th>IG Alcance</th><th>IG Int.</th><th>FB Seg.</th><th>Notas</th></tr>
            </thead>
            <tbody>
              {metricas.map((m, i) => (
                <tr key={i}>
                  <td>{m.fecha}</td>
                  <td>{m.ig_seguidores.toLocaleString()}</td>
                  <td>{m.ig_alcance.toLocaleString()}</td>
                  <td>{m.ig_interacciones.toLocaleString()}</td>
                  <td>{m.fb_seguidores.toLocaleString()}</td>
                  <td className={styles.notas}>{m.notas || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {metricas.length === 0 && !showForm && (
        <div className={styles.empty}>
          <p>Aún no hay métricas registradas.</p>
          <button className={styles.primaryBtn} onClick={() => setShowForm(true)}>Registrar primera métrica</button>
        </div>
      )}
    </div>
  );
}
