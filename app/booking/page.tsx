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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      if (!response.ok) {
        throw new Error('Error al procesar la reserva');
      }

      setSuccess(true);
      setFormData({
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

      // Redirigir a página de confirmación
      setTimeout(() => {
        window.location.href = '/booking/confirmacion';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full">
      {/* Hero */}
      <section className="relative w-full h-64 md:h-80 bg-gradient-to-r from-selva to-jade flex items-center justify-center">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-2">
            Reserva tu Suite
          </h1>
          <p className="font-body text-lg text-pergamino">
            Vive la experiencia de lujo en la Huasteca
          </p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Form */}
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {success && (
                  <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    ✓ Reserva recibida. Te enviaremos confirmación al email.
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    Error: {error}
                  </div>
                )}

                {/* Dates */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body font-semibold text-selva mb-2">
                      Check-in
                    </label>
                    <input
                      type="date"
                      name="checkIn"
                      value={formData.checkIn}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
                    />
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-selva mb-2">
                      Check-out
                    </label>
                    <input
                      type="date"
                      name="checkOut"
                      value={formData.checkOut}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
                    />
                  </div>
                </div>

                {/* Room & Guests */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body font-semibold text-selva mb-2">
                      Suite
                    </label>
                    <select
                      name="roomId"
                      value={formData.roomId}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} - ${room.price}/noche
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-selva mb-2">
                      Huéspedes
                    </label>
                    <input
                      type="number"
                      name="guests"
                      min="1"
                      max="6"
                      value={formData.guests}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
                    />
                  </div>
                </div>

                {/* Personal Info */}
                <div className="border-t border-arena pt-6">
                  <h3 className="font-display text-xl text-selva mb-4">Tus datos</h3>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Nombre"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Apellido"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Teléfono"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
                    />
                  </div>

                  <textarea
                    name="message"
                    placeholder="Mensaje adicional (opcional)"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brote hover:bg-ambar text-white font-body font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Confirmar Reserva'}
                </button>

                <p className="font-body text-sm text-gray-600 text-center">
                  Al hacer clic confirmas que aceptas nuestros{' '}
                  <Link href="/terminos" className="text-brote hover:underline">
                    términos y condiciones
                  </Link>
                </p>
              </form>
            </div>

            {/* Resumen */}
            {selectedRoom && (
              <div className="md:col-span-1">
                <div className="sticky top-24 p-6 bg-pergamino rounded-lg border border-jade">
                  <h3 className="font-display text-2xl text-selva mb-4">Resumen</h3>

                  <div className="space-y-4 mb-6 border-b border-arena pb-6">
                    <div>
                      <p className="font-body text-sm text-gray-600">Suite</p>
                      <p className="font-display text-lg text-selva">{selectedRoom.name}</p>
                    </div>
                    <div>
                      <p className="font-body text-sm text-gray-600">Fechas</p>
                      <p className="font-body text-sm text-selva">
                        {formData.checkIn && formData.checkOut
                          ? `${formData.checkIn} → ${formData.checkOut}`
                          : 'Selecciona fechas'}
                      </p>
                    </div>
                    <div>
                      <p className="font-body text-sm text-gray-600">Huéspedes</p>
                      <p className="font-body text-sm text-selva">{formData.guests}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between font-body text-sm">
                      <span>${selectedRoom.price}/noche</span>
                      <span>×</span>
                    </div>
                    <div className="flex justify-between font-display text-2xl text-jade border-t border-arena pt-4">
                      <span>Total</span>
                      <span>$---</span>
                    </div>
                  </div>

                  <p className="font-body text-xs text-gray-600 mt-4">
                    Recibirás un email de confirmación con detalles de pago
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-selva text-white text-center">
        <p className="font-body text-lg">
          ¿Preguntas? Contacta a{' '}
          <a
            href="https://wa.me/5248910007679"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ambar hover:underline font-semibold"
          >
            WhatsApp +52-489-100-7679
          </a>
        </p>
      </section>
    </main>
  );
}
