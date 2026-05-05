'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './ingresos.module.css';

interface KPIs {
  semana: { ingresos: number; reservas: number };
  mes: { ingresos: number; reservas: number; ocupacion: number; adr: number; revpar: number; deltaIngresos: number; deltaOcupacion: number };
  año: { ingresos: number; reservas: number };
  porMes: { mes: string; ingresos: number; reservas: number }[];
  suitesMasVendidas: { suite: string; noches: number; ingresos: number }[];
}

interface Props { kpis: KPIs }

function KPICard({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: number }) {
  return (
    <div className={styles.kpiCard}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>{value}</p>
      {sub && <p className={styles.kpiSub}>{sub}</p>}
      {delta !== undefined && (
        <p className={styles.kpiDelta} style={{ color: delta >= 0 ? '#2d7a34' : '#c9484a' }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs mes anterior
        </p>
      )}
    </div>
  );
}

const MXN = (v: number) => `$${v.toLocaleString('es-MX')}`;

export default function IngresosClient({ kpis }: Props) {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Ingresos</h1>
        <p className={styles.pageSub}>Métricas en tiempo real desde Google Sheets</p>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KPICard label="Ingresos esta semana" value={MXN(kpis.semana.ingresos)} sub={`${kpis.semana.reservas} reservas`} />
        <KPICard label="Ingresos este mes" value={MXN(kpis.mes.ingresos)} sub={`${kpis.mes.reservas} reservas`} delta={kpis.mes.deltaIngresos} />
        <KPICard label="Ocupación del mes" value={`${kpis.mes.ocupacion}%`} delta={kpis.mes.deltaOcupacion} />
        <KPICard label="ADR (precio promedio/noche)" value={MXN(kpis.mes.adr)} sub="Average Daily Rate" />
        <KPICard label="RevPAR" value={MXN(kpis.mes.revpar)} sub="Revenue per Available Room" />
        <KPICard label="Ingresos año {año}" value={MXN(kpis.año.ingresos)} sub={`${kpis.año.reservas} reservas totales`} />
      </div>

      {/* Gráfica de ingresos por mes */}
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Ingresos por mes (últimos 12 meses)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={kpis.porMes} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4ddd3" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#624820' }} />
            <YAxis tick={{ fontSize: 11, fill: '#624820' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v) => [`$${Number(v).toLocaleString('es-MX')} MXN`, 'Ingresos']}
              contentStyle={{ background: '#faf8f5', border: '1px solid #e4ddd3', borderRadius: 6, fontSize: 13 }}
            />
            <Bar dataKey="ingresos" fill="#1e3012" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Suites más vendidas */}
      <div className={styles.tableCard}>
        <h2 className={styles.chartTitle}>Suites más vendidas (año actual)</h2>
        <table className={styles.table}>
          <thead>
            <tr><th>Suite</th><th>Noches vendidas</th><th>Ingresos</th></tr>
          </thead>
          <tbody>
            {kpis.suitesMasVendidas.map(s => (
              <tr key={s.suite}>
                <td>{s.suite}</td>
                <td>{s.noches} noches</td>
                <td className={styles.total}>{MXN(s.ingresos)}</td>
              </tr>
            ))}
            {kpis.suitesMasVendidas.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign:'center', padding: 24, color: 'var(--sage)' }}>Sin datos de ventas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
