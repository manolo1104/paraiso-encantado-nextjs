'use client';

import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import styles from './contacto.module.css';

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ContactForm() {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '',
    fechaTentativa: '', noches: '', mensaje: '',
    _hp: '', // honeypot
  });
  const [status, setStatus] = useState<Status>('idle');

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.formSuccess}>
        <CheckCircle size={36} className={styles.formSuccessIcon} />
        <h3>¡Mensaje enviado!</h3>
        <p>Te respondemos en menos de 2 horas por este correo o por WhatsApp.</p>
        <a href="https://wa.me/524891007679" className={styles.formSuccessWa} target="_blank" rel="noopener noreferrer">
          También puedes escribirnos por WhatsApp →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.contactForm} noValidate>
      {/* Honeypot oculto — bots lo llenan, humanos no */}
      <input
        type="text" name="_hp" value={form._hp}
        onChange={e => set('_hp', e.target.value)}
        tabIndex={-1} aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
        autoComplete="off"
      />

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
          <span>Teléfono / WhatsApp</span>
          <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
            placeholder="+52 (opcional)" autoComplete="tel" />
        </label>
        <label className={styles.formField}>
          <span>Fecha tentativa de llegada</span>
          <input type="date" value={form.fechaTentativa} onChange={e => set('fechaTentativa', e.target.value)}
            min={new Date().toISOString().split('T')[0]} />
        </label>
        <label className={styles.formField}>
          <span>Número de noches</span>
          <input type="number" min={1} max={30} value={form.noches} onChange={e => set('noches', e.target.value)}
            placeholder="¿Cuántas noches?" />
        </label>
      </div>

      <label className={styles.formField} style={{ marginTop: 4 }}>
        <span>Mensaje *</span>
        <textarea rows={4} value={form.mensaje} onChange={e => set('mensaje', e.target.value)}
          placeholder="¿En qué podemos ayudarte? Suite que te interesa, preguntas sobre actividades, grupos, eventos especiales…"
          required />
      </label>

      {status === 'error' && (
        <p className={styles.formError}>
          Algo salió mal. Escríbenos directamente a <a href="mailto:reservas@paraisoencantado.com">reservas@paraisoencantado.com</a>.
        </p>
      )}

      <button type="submit" className={styles.formSubmit} disabled={status === 'sending'}>
        {status === 'sending'
          ? <><Loader2 size={16} className={styles.spin} /> Enviando…</>
          : <><Send size={15} /> Enviar mensaje</>
        }
      </button>
      <p className={styles.formNote}>Respondemos en menos de 2 horas · Sin compromiso</p>
    </form>
  );
}
