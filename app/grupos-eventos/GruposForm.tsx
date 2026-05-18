'use client';

import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import styles from './grupos-eventos.module.css';

type Status = 'idle' | 'sending' | 'success' | 'error';

const TIPOS = ['Boda o celebración', 'Evento corporativo', 'Reunión familiar', 'Retiro o team building', 'Otro'];
const PRESUPUESTOS = ['Menos de $30,000 MXN', '$30,000 – $80,000 MXN', '$80,000 – $150,000 MXN', 'Más de $150,000 MXN'];

export default function GruposForm() {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '',
    tipo: '', personas: '', fechaTentativa: '', presupuesto: '', mensaje: '',
    _hp: '',
  });
  const [status, setStatus] = useState<Status>('idle');

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form._hp) return;
    setStatus('sending');
    try {
      const mensajeCompleto = `SOLICITUD DE GRUPOS/EVENTOS\n\nTipo de evento: ${form.tipo || 'No especificado'}\nPersonas: ${form.personas || 'No especificado'}\nPresupuesto: ${form.presupuesto || 'No especificado'}\n\nMensaje:\n${form.mensaje}`;
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          fechaTentativa: form.fechaTentativa,
          mensaje: mensajeCompleto,
          _hp: form._hp,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.formSuccess}>
        <CheckCircle size={40} className={styles.formSuccessIcon} />
        <h3>¡Cotización recibida!</h3>
        <p>Te enviamos confirmación por email y te respondemos en menos de 2 horas con disponibilidad y precio.</p>
        <a href="https://wa.me/524891007679" className={styles.formSuccessWa} target="_blank" rel="noopener noreferrer">
          También puedes escribirnos por WhatsApp →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.gruposForm} noValidate>
      <input type="text" name="_hp" value={form._hp} onChange={e => set('_hp', e.target.value)}
        tabIndex={-1} aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }} autoComplete="off" />

      <div className={styles.formGrid}>
        <label className={styles.formField}>
          <span>Nombre *</span>
          <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)}
            placeholder="Tu nombre completo" required autoComplete="name" />
        </label>
        <label className={styles.formField}>
          <span>Email *</span>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="tu@correo.com" required autoComplete="email" />
        </label>
        <label className={styles.formField}>
          <span>WhatsApp / Teléfono</span>
          <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
            placeholder="+52..." autoComplete="tel" />
        </label>
        <label className={styles.formField}>
          <span>Fecha tentativa</span>
          <input type="date" value={form.fechaTentativa} onChange={e => set('fechaTentativa', e.target.value)}
            min={new Date().toISOString().split('T')[0]} />
        </label>
        <label className={styles.formField}>
          <span>Tipo de evento</span>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="">Selecciona...</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className={styles.formField}>
          <span>Número de personas</span>
          <input type="number" min={2} max={200} value={form.personas} onChange={e => set('personas', e.target.value)}
            placeholder="¿Cuántos asistentes?" />
        </label>
        <label className={styles.formField}>
          <span>Presupuesto aproximado</span>
          <select value={form.presupuesto} onChange={e => set('presupuesto', e.target.value)}>
            <option value="">Selecciona un rango...</option>
            {PRESUPUESTOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      <label className={styles.formField} style={{ marginTop: 4 }}>
        <span>Cuéntanos sobre tu evento *</span>
        <textarea rows={4} value={form.mensaje} onChange={e => set('mensaje', e.target.value)}
          placeholder="Tipo de celebración, número de noches, necesidades especiales, presupuesto aproximado..."
          required />
      </label>

      {status === 'error' && (
        <p className={styles.formError}>
          Algo salió mal. Escríbenos a{' '}
          <a href="mailto:reservas@paraisoencantado.com">reservas@paraisoencantado.com</a>.
        </p>
      )}

      <button type="submit" className={styles.formSubmit} disabled={status === 'sending'}>
        {status === 'sending'
          ? <><Loader2 size={16} className={styles.spin} /> Enviando…</>
          : <><Send size={15} /> Solicitar cotización gratuita</>
        }
      </button>
      <p className={styles.formNote}>Sin compromiso · Respondemos en menos de 2 horas</p>
    </form>
  );
}
