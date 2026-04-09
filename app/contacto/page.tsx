'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    type: 'inquiry',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al enviar el mensaje');

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', type: 'inquiry' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.85rem 1rem",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "2px",
    fontSize: "14px",
    fontFamily: '"Jost", system-ui, sans-serif',
    fontWeight: 300,
    background: "rgba(255,255,255,0.04)",
    color: "#f7f2e8",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <main className="w-full" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "40vh", padding: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 120% 100% at 50% 120%, #1e3012 0%, #0f0d0a 60%)" }}
        />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p
            className="font-body mb-5"
            style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            Contacto
          </p>
          <h1 className="font-display mb-4" style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}>
            Contáctanos
          </h1>
          <p className="font-body mx-auto" style={{ color: "rgba(240,235,224,0.55)", maxWidth: "480px", fontWeight: 300 }}>
            Estamos aquí para responder todas tus preguntas.
          </p>
        </div>
      </section>

      {/* ── INFO CARDS ── */}
      <section
        style={{
          background: "#1e3012",
          borderTop: "1px solid rgba(200,169,110,0.12)",
          borderBottom: "1px solid rgba(200,169,110,0.12)",
          padding: "48px 0",
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "rgba(200,169,110,0.08)" }}>
            {[
              { title: "Teléfono", value: "+52 (489) 100-7679", href: "tel:+524891007679" },
              { title: "Email", value: "reservas@paraisoencantado.com", href: "mailto:reservas@paraisoencantado.com" },
              { title: "WhatsApp", value: "Chat directo", href: "https://wa.me/5248910007679" },
            ].map((item) => (
              <div key={item.title} style={{ background: "#1e3012", padding: "28px 24px", textAlign: "center" }}>
                <p className="font-body mb-2" style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}>
                  {item.title}
                </p>
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="font-body"
                  style={{ fontSize: "15px", color: "rgba(240,235,224,0.8)", fontWeight: 300 }}
                >
                  {item.value}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <section style={{ background: "#0f0d0a", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <div className="mb-12">
            <p className="font-body mb-4" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}>
              Escríbenos
            </p>
            <h2 className="font-display" style={{ color: "#f7f2e8", fontWeight: 300 }}>
              Envía un <em style={{ color: "#c8a96e" }}>mensaje</em>
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {success && (
              <div style={{ padding: "14px 18px", background: "rgba(45,74,26,0.3)", border: "1px solid rgba(74,110,46,0.5)", borderRadius: "2px", fontSize: "14px", color: "#7aaa52" }}>
                ✓ Mensaje enviado exitosamente. Te contactaremos pronto.
              </div>
            )}
            {error && (
              <div style={{ padding: "14px 18px", background: "rgba(122,60,30,0.2)", border: "1px solid rgba(122,60,30,0.5)", borderRadius: "2px", fontSize: "14px", color: "#dc6a3a" }}>
                Error: {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" name="name" placeholder="Tu nombre" value={formData.name} onChange={handleChange} required style={inputStyle} />
              <input type="email" name="email" placeholder="Tu email" value={formData.email} onChange={handleChange} required style={inputStyle} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="tel" name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleChange} style={inputStyle} />
              <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                <option value="inquiry">Pregunta</option>
                <option value="reservation">Sobre reservas</option>
                <option value="complaint">Sugerencia</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <input type="text" name="subject" placeholder="Asunto" value={formData.subject} onChange={handleChange} style={inputStyle} />
            <textarea name="message" placeholder="Tu mensaje..." value={formData.message} onChange={handleChange} required rows={6} style={{ ...inputStyle, resize: "vertical" as const }} />

            <button
              type="submit"
              disabled={loading}
              className="font-body w-full"
              style={{
                padding: "16px",
                background: loading ? "rgba(200,169,110,0.5)" : "#c8a96e",
                color: "#152009",
                border: "none",
                borderRadius: "2px",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "3px",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </form>
        </div>
      </section>

      {/* ── UBICACIÓN ── */}
      <section style={{ background: "#152009", borderTop: "1px solid rgba(200,169,110,0.12)", padding: "96px 0" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-14">
            <p className="font-body mb-4" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "4px", textTransform: "uppercase", color: "#c8a96e" }}>
              Encuéntranos
            </p>
            <h2 className="font-display" style={{ color: "#f7f2e8", fontWeight: 300 }}>
              Ubicación
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-display mb-4" style={{ fontSize: "22px", color: "#f7f2e8", fontWeight: 300 }}>
                Paraíso Encantado
              </h3>
              <p className="font-body mb-4" style={{ fontSize: "14px", color: "rgba(240,235,224,0.55)", fontWeight: 300 }}>
                Xilitla, San Luis Potosí 79910, México
              </p>
              <p className="font-body mb-6" style={{ fontSize: "14px", color: "rgba(240,235,224,0.45)", fontWeight: 300 }}>
                A 7 minutos del centro de Xilitla y a pasos del Jardín Surrealista Edward James.
              </p>
              <div className="space-y-3">
                <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.5)", fontWeight: 300 }}>
                  <span style={{ color: "#c8a96e" }}>Teléfono:</span>{" "}
                  <a href="tel:+524891007679" style={{ color: "rgba(240,235,224,0.7)" }}>+52 (489) 100-7679</a>
                </p>
                <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.5)", fontWeight: 300 }}>
                  <span style={{ color: "#c8a96e" }}>Email:</span>{" "}
                  <a href="mailto:reservas@paraisoencantado.com" style={{ color: "rgba(240,235,224,0.7)" }}>reservas@paraisoencantado.com</a>
                </p>
              </div>
            </div>
            <div
              style={{
                height: "320px",
                background: "linear-gradient(135deg, rgba(30,48,18,0.6) 0%, rgba(45,74,26,0.3) 100%)",
                border: "1px solid rgba(200,169,110,0.12)",
                borderRadius: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div className="text-center" style={{ color: "rgba(240,235,224,0.4)" }}>
                <p className="font-display mb-2" style={{ fontSize: "24px" }}>🗺️</p>
                <p className="font-body" style={{ fontSize: "13px" }}>
                  Mapa interactivo<br />
                  <span style={{ fontSize: "11px" }}>Coordenadas: 21.3896, -98.9955</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
