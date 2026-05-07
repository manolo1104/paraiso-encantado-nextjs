'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  BedDouble, TrendingUp, CalendarCheck, DollarSign,
  MessageCircle, Mail, PenSquare, PhoneCall, Send, Sparkles,
  LogIn, LogOut, RefreshCw, ChevronRight,
} from 'lucide-react';
import type { InsightsData } from '@/lib/admin/insights';
import styles from './insights.module.css';

const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`;
const pct = (n: number) => `${n}%`;

const SUGGESTED = [
  '¿Cuáles suites están disponibles esta semana?',
  '¿Cómo va mi ocupación vs el mes pasado?',
  '¿Cuánto he ganado este año evitando OTAs?',
  '¿Qué días tengo más llegadas esta semana?',
];

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function InsightsClient() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/insights');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streaming]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput('');
    const next: ChatMsg[] = [...chatMessages, { role: 'user', content: msg }];
    setChatMessages(next);
    setStreaming(true);

    const assistantMsg: ChatMsg = { role: 'assistant', content: '' };
    setChatMessages([...next, assistantMsg]);

    try {
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.body) throw new Error('Sin respuesta');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: fullText };
          return updated;
        });
      }
    } catch {
      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Error al conectar con el asistente.' };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  if (loading || !data) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingSpinner} />
        <p>Cargando datos del hotel…</p>
      </div>
    );
  }

  const { hoy, mes, forecast7dias, origen, ahorroOTAs, agentes } = data;
  const checkins = hoy.movimientos.filter(m => m.tipo === 'checkin');
  const checkouts = hoy.movimientos.filter(m => m.tipo === 'checkout');

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Insights</h1>
          <p className={styles.subtitle}>
            {new Date(hoy.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={load} title="Actualizar">
          <RefreshCw size={16} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        <KpiCard
          icon={<BedDouble size={22} />}
          label="Ocupación hoy"
          value={`${hoy.suitesOcupadas}/13`}
          sub={pct(hoy.porcentajeOcupacion)}
          accent="#C9A97A"
          bar={hoy.porcentajeOcupacion}
        />
        <KpiCard
          icon={<TrendingUp size={22} />}
          label="RevPAR del mes"
          value={fmt(mes.revpar)}
          sub={`ADR: ${fmt(mes.adr)}`}
          accent="#4ade80"
        />
        <KpiCard
          icon={<CalendarCheck size={22} />}
          label="Reservas del mes"
          value={String(mes.reservas)}
          sub={`Ocupación ${pct(mes.ocupacion)}`}
          accent="#93c5fd"
        />
        <KpiCard
          icon={<DollarSign size={22} />}
          label="Ingresos del mes"
          value={fmt(mes.ingresos)}
          sub={`Ahorro OTAs: ${fmt(ahorroOTAs)}`}
          accent="#f9a8d4"
        />
      </div>

      {/* ── HOY EN EL HOTEL ───────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Hoy en el hotel</h2>
        {hoy.movimientos.length === 0 ? (
          <p className={styles.empty}>Sin movimientos programados para hoy.</p>
        ) : (
          <div className={styles.movGrid}>
            {checkins.length > 0 && (
              <div className={styles.movGroup}>
                <div className={styles.movGroupLabel}>
                  <LogIn size={14} color="#4ade80" />
                  <span style={{ color: '#4ade80' }}>Check-ins ({checkins.length})</span>
                </div>
                {checkins.map((m, i) => (
                  <MovRow key={i} mov={m} />
                ))}
              </div>
            )}
            {checkouts.length > 0 && (
              <div className={styles.movGroup}>
                <div className={styles.movGroupLabel}>
                  <LogOut size={14} color="#f87171" />
                  <span style={{ color: '#f87171' }}>Check-outs ({checkouts.length})</span>
                </div>
                {checkouts.map((m, i) => (
                  <MovRow key={i} mov={m} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── FORECAST + ORIGEN ─────────────────────────────────── */}
      <div className={styles.chartRow}>
        {/* 7-day forecast */}
        <section className={`${styles.section} ${styles.chartCard}`}>
          <h2 className={styles.sectionTitle}>Ocupación próximos 7 días</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={forecast7dias} barCategoryGap="30%">
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(250,248,245,0.6)', fontSize: 12, fontFamily: 'var(--font-jost)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis domain={[0, 13]} hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className={styles.tooltip}>
                      <strong>{d.label}</strong>
                      <span>{d.ocupadas}/13 suites ({d.porcentaje}%)</span>
                    </div>
                  );
                }}
              />
              <Bar dataKey="ocupadas" radius={[4, 4, 0, 0]}>
                {forecast7dias.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.porcentaje >= 80 ? '#4ade80' : d.porcentaje >= 50 ? '#C9A97A' : 'rgba(201,169,122,0.35)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.chartLegend}>
            <span><span className={styles.dot} style={{ background: '#4ade80' }} /> +80%</span>
            <span><span className={styles.dot} style={{ background: '#C9A97A' }} /> 50-79%</span>
            <span><span className={styles.dot} style={{ background: 'rgba(201,169,122,0.35)' }} /> &lt;50%</span>
          </div>
        </section>

        {/* Origen */}
        <section className={`${styles.section} ${styles.chartCard}`}>
          <h2 className={styles.sectionTitle}>Origen de reservas</h2>
          {origen.length === 0 ? (
            <p className={styles.empty}>Sin reservas este mes aún.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={origen}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {origen.map((o, i) => (
                      <Cell key={i} fill={o.color} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: 'rgba(250,248,245,0.75)', fontSize: 12, fontFamily: 'var(--font-jost)' }}>
                        {value}
                      </span>
                    )}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className={styles.tooltip}>
                          <strong>{d.label}</strong>
                          <span>{d.count} reservas</span>
                          <span>{fmt(d.ingresos)}</span>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.otaSavings}>
                <span className={styles.otaLabel}>Ahorro OTAs (año)</span>
                <span className={styles.otaValue}>{fmt(ahorroOTAs)} MXN</span>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── ACTIVIDAD AGENTES ─────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Actividad de agentes</h2>
        <div className={styles.agentGrid}>
          <AgentCard
            icon={<MessageCircle size={20} />}
            title="Bot WhatsApp"
            color="#4ade80"
            rows={[
              { label: 'Conversaciones hoy', value: String(agentes.whatsapp.conversacionesHoy) },
              { label: 'Conversaciones mes', value: String(agentes.whatsapp.conversacionesMes) },
            ]}
          />
          <AgentCard
            icon={<Mail size={20} />}
            title="Emails enviados (mes)"
            color="#93c5fd"
            rows={[
              { label: 'Confirmación', value: String(agentes.emails.confirmacion) },
              { label: 'Pre-estancia', value: String(agentes.emails.preestancia) },
              { label: 'Post-estancia', value: String(agentes.emails.postestancia) },
            ]}
          />
          <AgentCard
            icon={<PhoneCall size={20} />}
            title="Agente de Llamadas"
            color="rgba(250,248,245,0.3)"
            rows={[{ label: 'Estado', value: 'Próximamente' }]}
            disabled
          />
          <AgentCard
            icon={<PenSquare size={20} />}
            title="Blogs publicados"
            color="#f9a8d4"
            rows={[{ label: 'Este mes', value: String(agentes.blogs) }]}
          />
        </div>
      </section>

      {/* ── ASISTENTE IA ──────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Sparkles size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Asistente IA
        </h2>

        <div className={styles.chatWrap}>
          {chatMessages.length === 0 && (
            <div className={styles.chatEmpty}>
              <p>Pregúntame sobre los datos de tu hotel en tiempo real.</p>
              <div className={styles.suggestedWrap}>
                {SUGGESTED.map((s, i) => (
                  <button key={i} className={styles.suggestedChip} onClick={() => sendMessage(s)}>
                    <ChevronRight size={12} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((m, i) => (
            <div key={i} className={`${styles.chatMsg} ${m.role === 'user' ? styles.chatUser : styles.chatAssistant}`}>
              <div className={styles.chatBubble}>
                {m.content || (streaming && i === chatMessages.length - 1 ? '…' : '')}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form
          className={styles.chatForm}
          onSubmit={e => { e.preventDefault(); sendMessage(); }}
        >
          <input
            className={styles.chatInput}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pregunta sobre tus datos… (ej. ¿Cuál suite deja más ingresos?)"
            disabled={streaming}
          />
          <button className={styles.chatSend} type="submit" disabled={streaming || !input.trim()}>
            <Send size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, accent, bar,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
  bar?: number;
}) {
  return (
    <div className={styles.kpiCard} style={{ '--accent': accent } as React.CSSProperties}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiBody}>
        <p className={styles.kpiLabel}>{label}</p>
        <p className={styles.kpiValue}>{value}</p>
        <p className={styles.kpiSub}>{sub}</p>
        {bar !== undefined && (
          <div className={styles.kpiBar}>
            <div className={styles.kpiBarFill} style={{ width: `${bar}%`, background: accent }} />
          </div>
        )}
      </div>
    </div>
  );
}

function MovRow({ mov }: { mov: { cliente: string; habitaciones: string; huespedes: number; noches: number; total: number; confirmacion: string } }) {
  return (
    <div className={styles.movRow}>
      <div className={styles.movMain}>
        <span className={styles.movCliente}>{mov.cliente}</span>
        <span className={styles.movSuite}>{mov.habitaciones}</span>
      </div>
      <div className={styles.movMeta}>
        <span>{mov.huespedes} huéspedes · {mov.noches} noches</span>
        <span className={styles.movTotal}>{fmt(mov.total)}</span>
      </div>
    </div>
  );
}

function AgentCard({
  icon, title, color, rows, disabled,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  rows: { label: string; value: string }[];
  disabled?: boolean;
}) {
  return (
    <div className={`${styles.agentCard} ${disabled ? styles.agentDisabled : ''}`}>
      <div className={styles.agentHeader}>
        <span style={{ color }}>{icon}</span>
        <span className={styles.agentTitle}>{title}</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className={styles.agentRow}>
          <span className={styles.agentLabel}>{r.label}</span>
          <span className={styles.agentValue} style={{ color: disabled ? 'rgba(250,248,245,0.3)' : color }}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
