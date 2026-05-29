'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, CheckCircle, Clock, AlertTriangle, X, Plus, Loader2 } from 'lucide-react';
import type { ChecklistResult, MaintenanceRow } from '@/lib/admin/operations';
import { getChecklistItems, type ChecklistItem } from '@/lib/admin/cleaning-config';
import styles from './operaciones.module.css';

interface Props {
  initialCleaning: ChecklistResult[];
  initialMaintenance: MaintenanceRow[];
  suites: string[];
  overdueTasks: number;
  soonTasks: number;
}

// ── Limpieza ──────────────────────────────────────────────────────────────────

function ChecklistModal({ suite, onClose, onSaved }: {
  suite: string; onClose: () => void; onSaved: () => void;
}) {
  const items: ChecklistItem[] = getChecklistItems(suite);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [personal, setPersonal] = useState('');
  const [turno, setTurno] = useState<'MAÑANA' | 'TARDE'>('MAÑANA');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function checkAll() { setChecked(new Set(items.map(i => i.id))); }

  async function handleSave(estado: 'COMPLETO' | 'INCOMPLETO') {
    setLoading(true);
    try {
      const completados = items.filter(i => checked.has(i.id)).map(i => i.label);
      const pendientes = items.filter(i => !checked.has(i.id)).map(i => i.label);
      await fetch('/api/admin/operaciones/limpieza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suite, turno, personal, itemsCompletados: completados, itemsPendientes: pendientes, observaciones, estado }),
      });
      onSaved();
      onClose();
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{suite}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.checklistMeta}>
            <label className={styles.field}><span>Personal</span>
              <input value={personal} onChange={e => setPersonal(e.target.value)} placeholder="Nombre del encargado" />
            </label>
            <label className={styles.field}><span>Turno</span>
              <select value={turno} onChange={e => setTurno(e.target.value as 'MAÑANA' | 'TARDE')}>
                <option value="MAÑANA">Mañana</option>
                <option value="TARDE">Tarde</option>
              </select>
            </label>
          </div>
          <div className={styles.checklistHeader}>
            <span className={styles.checklistProgress}>{checked.size}/{items.length} items</span>
            <button className={styles.checkAllBtn} onClick={checkAll}>Marcar todos ✓</button>
          </div>
          <div className={styles.checklistItems}>
            {items.map(item => (
              <label key={item.id} className={`${styles.checkItem} ${checked.has(item.id) ? styles.checkItemDone : ''}`}>
                <input type="checkbox" checked={checked.has(item.id)} onChange={() => toggle(item.id)} />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
          <label className={styles.field}><span>Observaciones</span>
            <textarea rows={2} value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Notas adicionales..." />
          </label>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancelar</button>
          <button className={styles.warnBtn} onClick={() => handleSave('INCOMPLETO')} disabled={loading}>
            {loading ? <Loader2 size={14} className={styles.spin} /> : null} Incompleto
          </button>
          <button className={styles.primaryBtn} onClick={() => handleSave('COMPLETO')} disabled={loading}>
            {loading ? <Loader2 size={14} className={styles.spin} /> : null} Marcar completo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mantenimiento ─────────────────────────────────────────────────────────────

function AddTaskModal({ onClose, onSaved, suites }: { onClose: () => void; onSaved: () => void; suites: string[] }) {
  const [form, setForm] = useState({ suite: suites[0] || 'HOTEL', tarea: '', frecuenciaDias: 30, notas: '', responsable: '' });
  const [loading, setLoading] = useState(false);
  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })); }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/admin/operaciones/mantenimiento', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    onSaved(); onClose();
  }
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}><h3>Nueva tarea de mantenimiento</h3><button onClick={onClose}><X size={18} /></button></div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.grid2}>
            <label className={styles.field}><span>Suite / Área</span>
              <select value={form.suite} onChange={e => set('suite', e.target.value)}>
                <option value="HOTEL">HOTEL (general)</option>
                {suites.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className={styles.field}><span>Frecuencia (días)</span>
              <input type="number" min={1} value={form.frecuenciaDias} onChange={e => set('frecuenciaDias', parseInt(e.target.value) || 30)} />
            </label>
          </div>
          <label className={styles.field}><span>Tarea *</span>
            <input required value={form.tarea} onChange={e => set('tarea', e.target.value)} placeholder="Ej: Limpieza filtro A/C" />
          </label>
          <label className={styles.field}><span>Responsable</span>
            <input value={form.responsable} onChange={e => set('responsable', e.target.value)} />
          </label>
          <label className={styles.field}><span>Notas</span>
            <textarea rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} />
          </label>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? <Loader2 size={14} className={styles.spin} /> : null} Agregar tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OperacionesClient({ initialCleaning, initialMaintenance, suites, overdueTasks, soonTasks }: Props) {
  const [tab, setTab] = useState<'limpieza' | 'mantenimiento'>('limpieza');
  const [cleaning, setCleaning] = useState(initialCleaning);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const refreshCleaning = useCallback(async () => {
    const res = await fetch('/api/admin/operaciones/limpieza');
    if (res.ok) setCleaning(await res.json());
  }, []);

  const refreshMaintenance = useCallback(async () => {
    const res = await fetch('/api/admin/operaciones/mantenimiento');
    if (res.ok) setMaintenance(await res.json());
  }, []);

  async function markDone(suite: string, tarea: string) {
    const personal = prompt('¿Quién realizó el mantenimiento?') || '';
    setLoading(true);
    await fetch('/api/admin/operaciones/mantenimiento', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suite, tarea, completadoPor: personal }),
    });
    await refreshMaintenance();
    setLoading(false);
  }

  function getSuiteStatus(suite: string) {
    const result = cleaning.find(c => c.suite === suite);
    if (!result) return 'none';
    return result.estado;
  }

  const statusIcon = (estado: string) => {
    if (estado === 'COMPLETO') return <CheckCircle size={16} color="#2d7a34" />;
    if (estado === 'INCOMPLETO') return <AlertTriangle size={16} color="#c9484a" />;
    if (estado === 'EN_PROCESO') return <Clock size={16} color="#52b788" />;
    return null;
  };

  const completedToday = cleaning.filter(c => c.estado === 'COMPLETO').length;
  const overdueCount = maintenance.filter(t => t.overdue).length;

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' });

  return (
    <div className={styles.wrap}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Operaciones</h1>
          <p className={styles.pageSub}>{today.charAt(0).toUpperCase() + today.slice(1)}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={tab === 'limpieza' ? refreshCleaning : refreshMaintenance} title="Actualizar">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryCard} style={{ borderColor: '#2d7a34' }}>
          <CheckCircle size={18} color="#2d7a34" />
          <div><strong>{completedToday}</strong><span>suites limpias hoy</span></div>
        </div>
        <div className={styles.summaryCard} style={{ borderColor: overdueCount > 0 ? '#c9484a' : '#e5e7eb' }}>
          <AlertTriangle size={18} color={overdueCount > 0 ? '#c9484a' : '#aaa'} />
          <div><strong>{overdueCount}</strong><span>tareas vencidas</span></div>
        </div>
        <div className={styles.summaryCard} style={{ borderColor: soonTasks > 0 ? '#52b788' : '#e5e7eb' }}>
          <Clock size={18} color={soonTasks > 0 ? '#52b788' : '#aaa'} />
          <div><strong>{soonTasks}</strong><span>vencen pronto</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'limpieza' ? styles.tabActive : ''}`} onClick={() => setTab('limpieza')}>
          Limpieza
        </button>
        <button className={`${styles.tab} ${tab === 'mantenimiento' ? styles.tabActive : ''}`} onClick={() => setTab('mantenimiento')}>
          Mantenimiento {overdueCount > 0 && <span className={styles.badge}>{overdueCount}</span>}
        </button>
      </div>

      {/* Contenido: Limpieza */}
      {tab === 'limpieza' && (
        <div className={styles.suiteGrid}>
          {suites.map(suite => {
            const estado = getSuiteStatus(suite);
            const result = cleaning.find(c => c.suite === suite);
            return (
              <div
                key={suite}
                className={`${styles.suiteCard} ${styles[`suite_${estado}`]}`}
                onClick={() => setSelectedSuite(suite)}
              >
                <div className={styles.suiteCardTop}>
                  <span className={styles.suiteName}>{suite}</span>
                  {statusIcon(estado)}
                </div>
                {result && (
                  <div className={styles.suiteCardMeta}>
                    {result.personal && <span>{result.personal}</span>}
                    {result.itemsCompletados.length > 0 && (
                      <span>{result.itemsCompletados.length} items ✓</span>
                    )}
                  </div>
                )}
                {estado === 'none' && <p className={styles.suiteCardCta}>Registrar limpieza →</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Contenido: Mantenimiento — acordeón por suite */}
      {tab === 'mantenimiento' && (
        <div>
          <div className={styles.mantHeader}>
            <p className={styles.pageSub}>{maintenance.length} tareas registradas</p>
            <button className={styles.primaryBtn} onClick={() => setShowAddTask(true)}>
              <Plus size={15} /> Agregar tarea
            </button>
          </div>

          {/* Agrupar por suite */}
          {(() => {
            const bySuite: Record<string, typeof maintenance> = {};
            maintenance.forEach(t => {
              const key = t.suite || 'HOTEL';
              if (!bySuite[key]) bySuite[key] = [];
              bySuite[key].push(t);
            });
            return Object.entries(bySuite).map(([suite, tasks]) => {
              const overdueInSuite = tasks.filter(t => t.overdue).length;
              const soonInSuite = tasks.filter(t => !t.overdue && t.proximaVez && Math.round((new Date(t.proximaVez + 'T12:00:00').getTime() - Date.now()) / 86400000) <= 3).length;
              const isOpen = openAccordion === suite;
              return (
                <div key={suite} className={styles.accordionItem}>
                  <button className={styles.accordionHeader} onClick={() => setOpenAccordion(isOpen ? null : suite)}>
                    <span className={styles.accordionSuiteName}>{suite}</span>
                    <span className={styles.accordionMeta}>
                      {overdueInSuite > 0 && <span className={styles.badgeOverdue}>{overdueInSuite} vencida{overdueInSuite !== 1 ? 's' : ''}</span>}
                      {soonInSuite > 0 && !overdueInSuite && <span className={styles.badgeSoon}>{soonInSuite} próxima</span>}
                      {!overdueInSuite && !soonInSuite && <span className={styles.badgeOk}>{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</span>}
                    </span>
                    <span className={`${styles.accordionChevron} ${isOpen ? styles.accordionChevronOpen : ''}`}>›</span>
                  </button>
                  {isOpen && (
                    <div className={styles.accordionBody}>
                      {tasks.map((t, i) => {
                        const days = t.proximaVez ? Math.round((new Date(t.proximaVez + 'T12:00:00').getTime() - Date.now()) / 86400000) : 999;
                        return (
                          <div key={i} className={`${styles.accordionTask} ${t.overdue ? styles.accordionTaskOverdue : ''}`}>
                            <div className={styles.accordionTaskMain}>
                              <span className={styles.accordionTaskName}>{t.tarea}</span>
                              {t.notas && <span className={styles.taskNota}>{t.notas}</span>}
                            </div>
                            <div className={styles.accordionTaskMeta}>
                              <span>Cada {t.frecuenciaDias}d</span>
                              <span>Última: {t.ultimaVez || '—'}</span>
                              <span>Próxima: {t.proximaVez || '—'}</span>
                              {t.overdue
                                ? <span className={styles.badgeOverdue}>+{t.daysOverdue}d</span>
                                : days <= 3 ? <span className={styles.badgeSoon}>{days}d</span>
                                : <span className={styles.badgeOk}>OK</span>
                              }
                            </div>
                            <button className={styles.doneBtn} onClick={() => markDone(t.suite, t.tarea)} disabled={loading}>
                              ✓ Hecho
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {selectedSuite && (
        <ChecklistModal
          suite={selectedSuite}
          onClose={() => setSelectedSuite(null)}
          onSaved={refreshCleaning}
        />
      )}
      {showAddTask && (
        <AddTaskModal
          suites={suites}
          onClose={() => setShowAddTask(false)}
          onSaved={refreshMaintenance}
        />
      )}
    </div>
  );
}
