'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  BedDouble, TrendingUp, CalendarCheck, DollarSign,
  MessageCircle, Mail, PenSquare, PhoneCall, Send, Sparkles,
  LogIn, LogOut, RefreshCw, ChevronRight, Trash2,
} from 'lucide-react';
import type { InsightsData } from '@/lib/admin/insights';
import styles from './insights.module.css';

const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`;
const pct = (n: number) => `${n}%`;

const CHAT_STORAGE_KEY = 'pe_insights_chat';
const MAX_STORED_MSGS = 20;

const SUGGESTED = [
  '¿Cuáles suites tienen check-in hoy?',
  '¿Cómo va mi ocupación este mes?',
  '¿Cuánto he ahorrado en comisiones OTA?',
  '¿Qué días de la semana tengo más llegadas?',
];

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

function loadChatHistory(): ChatMsg[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChatHistory(msgs: ChatMsg[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED_MSGS)));
  } catch { /* ignore */ }
}

export default function InsightsClient() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setChatMessages(loadChatHistory());
    }
  }, []);

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

  function clearChat() {
    setChatMessages([]);
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
  }

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput('');

    const next: ChatMsg[] = [...chatMessages, { role: 'user', content: msg }];
    setChatMessages(next);
    saveChatHistory(next);
    setStreaming(true);

    const placeholder: ChatMsg = { role: 'assistant', content: '' };
    setChatMessages([...next, placeholder]);

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

      // Save final conversation to sessionStorage
      const finalMsgs: ChatMsg[] = [...next, { role: 'assistant', content: fullText }];
      saveChatHistory(finalMsgs);
      setChatMessages(finalMsgs);

    } catch {
      const errorMsgs: ChatMsg[] = [...next, { role: 'assistant', content: 'Error al conectar con el asistente. Intenta de nuevo.' }];
      setChatMessages(errorMsgs);
      saveChatHistory(errorMsgs);
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

  const FOREST = '#2d4a3e';

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
          <RefreshCw size={15} />
          Actualizar
        </button>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        <KpiCard
          icon={<BedDouble size={20} />}
          label="Ocupación hoy"
          value={`${hoy.suitesOcupadas}/13`}
          sub={pct(hoy.porcentajeOcupacion)}
          accent={FOREST}
          bar={hoy.porcentajeOcupacion}
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="RevPAR del mes"
          value={fmt(mes.revpar)}
          sub={`ADR: ${fmt(mes.adr)}`}
          accent={FOREST}
        />
        <KpiCard
          icon={<CalendarCheck size={20} />}
          label="Reservas del mes"
          value={String(mes.reservas)}
          sub={`Ocupación ${pct(mes.ocupacion)}`}
          accent={FOREST}
        />
        <KpiCard
          icon={<DollarSign size={20} />}
          label="Ingresos del mes"
          value={fmt(mes.ingresos)}
          sub={`Ahorro OTAs año: ${fmt(ahorroOTAs)}`}
          accent={FOREST}
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
                  <LogIn size={13} color="#2d7a34" />
                  <span style={{ color: '#2d7a34' }}>Check-ins ({checkins.length})</span>
                </div>
                {checkins.map((m, i) => <MovRow key={i} mov={m} />)}
              </div>
            )}
            {checkouts.length > 0 && (
              <div className={styles.movGroup}>
                <div className={styles.movGroupLabel}>
                  <LogOut size={13} color="#c9484a" />
                  <span style={{ color: '#c9484a' }}>Check-outs ({checkouts.length})</span>
                </div>
                {checkouts.map((m, i) => <MovRow key={i} mov={m} />)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── FORECAST + ORIGEN ─────────────────────────────────── */}
      <div className={styles.chartRow}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ocupación próximos 7 días</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={forecast7dias} barCategoryGap="30%">
              <XAxis
                dataKey="label"
                tick={{ fill: '#7a7060', fontSize: 12, fontFamily: 'var(--font-jost)' }}
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
                    fill={d.porcentaje >= 80 ? '#2d7a34' : d.porcentaje >= 50 ? '#C9A97A' : '#e4ddd3'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.chartLegend}>
            <span><span className={styles.dot} style={{ background: '#2d7a34' }} /> +80%</span>
            <span><span className={styles.dot} style={{ background: '#C9A97A' }} /> 50-79%</span>
            <span><span className={styles.dot} style={{ background: '#e4ddd3' }} /> &lt;50%</span>
          </div>
        </section>

        <section className={styles.section}>
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
                      <span style={{ color: '#7a7060', fontSize: 12, fontFamily: 'var(--font-jost)' }}>
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
            icon={<MessageCircle size={18} color="#25D366" />}
            title="Bot WhatsApp"
            rows={[
              { label: 'Conversaciones hoy', value: String(agentes.whatsapp.conversacionesHoy) },
              { label: 'Conversaciones mes', value: String(agentes.whatsapp.conversacionesMes) },
            ]}
          />
          <AgentCard
            icon={<Mail size={18} color="#2d4a3e" />}
            title="Emails (mes)"
            rows={[
              { label: 'Confirmación', value: String(agentes.emails.confirmacion) },
              { label: 'Pre-estancia', value: String(agentes.emails.preestancia) },
              { label: 'Post-estancia', value: String(agentes.emails.postestancia) },
            ]}
          />
          <AgentCard
            icon={<PhoneCall size={18} color="#bbb" />}
            title="Agente Llamadas"
            rows={[{ label: 'Estado', value: 'Próximamente' }]}
            disabled
          />
          <AgentCard
            icon={<PenSquare size={18} color="#C9A97A" />}
            title="Blogs publicados"
            rows={[{ label: 'Este mes', value: String(agentes.blogs) }]}
          />
        </div>
      </section>

      {/* ── ASISTENTE IA ──────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.chatHeader}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
            <Sparkles size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: '#C9A97A' }} />
            Asistente IA
          </h2>
          {chatMessages.length > 0 && (
            <button className={styles.chatClearBtn} onClick={clearChat} title="Borrar conversación">
              <Trash2 size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Limpiar
            </button>
          )}
        </div>

        <div className={styles.chatWrap}>
          {chatMessages.length === 0 && (
            <div className={styles.chatEmpty}>
              <p>Pregúntame sobre los datos de tu hotel en tiempo real.</p>
              <div className={styles.suggestedWrap}>
                {SUGGESTED.map((s, i) => (
                  <button key={i} className={styles.suggestedChip} onClick={() => sendMessage(s)}>
                    <ChevronRight size={11} />
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
            <Send size={15} />
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
    <div className={styles.kpiCard}>
      <div className={styles.kpiIcon} style={{ color: accent }}>{icon}</div>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiSub}>{sub}</p>
      {bar !== undefined && (
        <div className={styles.kpiBar}>
          <div className={styles.kpiBarFill} style={{ width: `${bar}%`, background: accent }} />
        </div>
      )}
    </div>
  );
}

function MovRow({ mov }: { mov: { cliente: string; habitaciones: string; huespedes: number; noches: number; total: number } }) {
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
  icon, title, rows, disabled,
}: {
  icon: React.ReactNode;
  title: string;
  rows: { label: string; value: string }[];
  disabled?: boolean;
}) {
  return (
    <div className={`${styles.agentCard} ${disabled ? styles.agentDisabled : ''}`}>
      <div className={styles.agentHeader}>
        {icon}
        <span className={styles.agentTitle}>{title}</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className={styles.agentRow}>
          <span className={styles.agentLabel}>{r.label}</span>
          <span className={styles.agentValue}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
