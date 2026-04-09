'use client';

import { useState } from 'react';
import Link from 'next/link';
import { rooms } from '@/lib/data';

export default function BookingPage() {
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    roomId: rooms[0].id,
    guests: 2,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const selectedRoom = rooms.find((r) => r.id === formData.roomId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al procesar la reserva');

      setSuccess(true);
      setFormData({
        checkIn: '', checkOut: '', roomId: rooms[0].id, guests: 2,
        firstName: '', lastName: '', email: '', phone: '', message: '',
      });
      setTimeout(() => { window.location.href = '/booking/confirmacion'; }, 2000);
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontSize: "9px",
    fontWeight: 500,
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "#c8a96e",
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
          <p className="font-body mb-5" style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}>
            Reserva Directa
          </p>
          <h1 className="font-display mb-4" style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}>
            Reserva tu <span style={{ color: "#c8a96e" }}>Suite</span>
          </h1>
          <p className="font-body mx-auto" style={{ color: "rgba(240,235,224,0.55)", maxWidth: "480px", fontWeight: 300 }}>
            Vive la experiencia de lujo en la Huasteca. Sin intermediarios, mejor precio garantizado.
          </p>
        </div>
      </section>

      {/* ── BOOKING FORM ── */}
      <section style={{ background: "#0f0d0a", padding: "80px 0 96px" }}>
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Form */}
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {success && (
                  <div style={{ padding: "14px 18px", background: "rgba(45,74,26,0.3)", border: "1px solid rgba(74,110,46,0.5)", borderRadius: "2px", fontSize: "14px", color: "#7aaa52" }}>
                    ✓ Reserva recibida. Te enviaremos confirmación al email.
                  </div>
                )}
                {error && (
                  <div style={{ padding: "14px 18px", background: "rgba(122,60,30,0.2)", border: "1px solid rgba(122,60,30,0.5)", borderRadius: "2px", fontSize: "14px", color: "#dc6a3a" }}>
                    Error: {error}
                  </div>
                )}

                {/* Dates */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="font-body" style={labelStyle}>Check-in</label>
                    <input type="date" name="checkIn" value={formData.checkIn} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label className="font-body" style={labelStyle}>Check-out</label>
                    <input type="date" name="checkOut" value={formData.checkOut} onChange={handleChange} required style={inputStyle} />
                  </div>
                </div>

                {/* Room & Guests */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="font-body" style={labelStyle}>Suite</label>
                    <select name="roomId" value={formData.roomId} onChange={handleChange} style={inputStyle}>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id} style={{ background: "#1e3012", color: "#f7f2e8" }}>
                          {room.name} — ${room.price.toLocaleString("es-MX")}/noche
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body" style={labelStyle}>Huéspedes</label>
                    <input type="number" name="guests" min="1" max="6" value={formData.guests} onChange={handleChange} style={inputStyle} />
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid rgba(200,169,110,0.12)", paddingTop: "28px" }}>
                  <p className="font-body mb-5" style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}>
                    Tus datos
                  </p>

                  <div className="grid md:grid-cols-2 gap-5 mb-5">
                    <input type="text" name="firstName" placeholder="Nombre" value={formData.firstName} onChange={handleChange} required style={inputStyle} />
                    <input type="text" name="lastName" placeholder="Apellido" value={formData.lastName} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-5 mb-5">
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={inputStyle} />
                    <input type="tel" name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <textarea name="message" placeholder="Mensaje adicional (opcional)" value={formData.message} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: "vertical" as const }} />
                </div>

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
                  {loading ? 'Procesando...' : 'Confirmar Reserva'}
                </button>

                <p className="font-body text-center" style={{ fontSize: "12px", color: "rgba(240,235,224,0.4)", fontWeight: 300 }}>
                  Al hacer clic confirmas que aceptas nuestros{' '}
                  <Link href="/terminos" style={{ color: "#c8a96e", borderBottom: "1px solid rgba(200,169,110,0.3)" }}>
                    términos y condiciones
                  </Link>
                </p>
              </form>
            </div>

            {/* Summary Sidebar */}
            {selectedRoom && (
              <div className="md:col-span-1">
                <div
                  className="sticky top-24"
                  style={{
                    background: "rgba(30,48,18,0.4)",
                    border: "1px solid rgba(200,169,110,0.15)",
                    borderRadius: "2px",
                    padding: "28px 24px",
                  }}
                >
                  <p className="font-body mb-4" style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}>
                    Resumen
                  </p>

                  <div className="space-y-4 mb-6" style={{ paddingBottom: "20px", borderBottom: "1px solid rgba(200,169,110,0.12)" }}>
                    <div>
                      <p className="font-body" style={{ fontSize: "11px", color: "rgba(240,235,224,0.4)", letterSpacing: "1px" }}>Suite</p>
                      <p className="font-display" style={{ fontSize: "18px", color: "#f7f2e8", fontWeight: 300 }}>{selectedRoom.name}</p>
                    </div>
                    <div>
                      <p className="font-body" style={{ fontSize: "11px", color: "rgba(240,235,224,0.4)", letterSpacing: "1px" }}>Fechas</p>
                      <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.7)", fontWeight: 300 }}>
                        {formData.checkIn && formData.checkOut ? `${formData.checkIn} → ${formData.checkOut}` : 'Selecciona fechas'}
                      </p>
                    </div>
                    <div>
                      <p className="font-body" style={{ fontSize: "11px", color: "rgba(240,235,224,0.4)", letterSpacing: "1px" }}>Huéspedes</p>
                      <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.7)", fontWeight: 300 }}>{formData.guests}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between" style={{ fontSize: "14px", color: "rgba(240,235,224,0.5)" }}>
                      <span className="font-body">${selectedRoom.price.toLocaleString("es-MX")}/noche</span>
                    </div>
                    <div className="flex justify-between" style={{ paddingTop: "16px", borderTop: "1px solid rgba(200,169,110,0.12)" }}>
                      <span className="font-display" style={{ fontSize: "18px", color: "#f7f2e8", fontWeight: 300 }}>Total</span>
                      <span className="font-display" style={{ fontSize: "24px", color: "#c8a96e", fontWeight: 300 }}>$---</span>
                    </div>
                  </div>

                  <p className="font-body mt-5" style={{ fontSize: "11px", color: "rgba(240,235,224,0.35)", fontWeight: 300 }}>
                    Recibirás un email de confirmación con detalles de pago.
                  </p>

                  {/* Trust badges */}
                  <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(200,169,110,0.08)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontSize: "13px" }}>🔒</span>
                      <span className="font-body" style={{ fontSize: "11px", color: "rgba(240,235,224,0.35)" }}>Pago seguro SSL</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontSize: "13px" }}>✓</span>
                      <span className="font-body" style={{ fontSize: "11px", color: "rgba(240,235,224,0.35)" }}>Mejor precio garantizado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "13px" }}>🛡️</span>
                      <span className="font-body" style={{ fontSize: "11px", color: "rgba(240,235,224,0.35)" }}>Cancelación flexible</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background: "#152009",
          borderTop: "1px solid rgba(200,169,110,0.12)",
          padding: "40px 0",
          textAlign: "center",
        }}
      >
        <p className="font-body" style={{ fontSize: "14px", color: "rgba(240,235,224,0.5)", fontWeight: 300 }}>
          ¿Preguntas? Contacta a{' '}
          <a
            href="https://wa.me/5248910007679"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#c8a96e", borderBottom: "1px solid rgba(200,169,110,0.3)" }}
          >
            WhatsApp +52-489-100-7679
          </a>
        </p>
      </section>
    </main>
  );
}
