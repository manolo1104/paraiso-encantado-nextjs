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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        type: 'inquiry',
      });

      setTimeout(() => setSuccess(false), 5000);
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
            Contáctanos
          </h1>
          <p className="font-body text-lg text-pergamino">
            Estamos aquí para responder todas tus preguntas
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Info Cards */}
            <div className="p-6 bg-pergamino rounded-lg border border-jade">
              <h3 className="font-display text-xl text-selva mb-2">Teléfono</h3>
              <a href="tel:+524891007679" className="font-body text-lg text-brote hover:text-ambar transition-colors">
                +52 (489) 100-7679
              </a>
            </div>

            <div className="p-6 bg-pergamino rounded-lg border border-jade">
              <h3 className="font-display text-xl text-selva mb-2">Email</h3>
              <a href="mailto:reservas@paraisoencantado.com" className="font-body text-lg text-brote hover:text-ambar transition-colors">
                reservas@paraisoencantado.com
              </a>
            </div>

            <div className="p-6 bg-pergamino rounded-lg border border-jade">
              <h3 className="font-display text-xl text-selva mb-2">WhatsApp</h3>
              <a
                href="https://wa.me/5248910007679"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-lg text-green-600 hover:text-green-700 transition-colors"
              >
                Chat directo
              </a>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                ✓ Mensaje enviado exitosamente. Te contactaremos pronto.
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                Error: {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={handleChange}
                required
                className="px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
              />
              <input
                type="email"
                name="email"
                placeholder="Tu email"
                value={formData.email}
                onChange={handleChange}
                required
                className="px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="tel"
                name="phone"
                placeholder="Teléfono"
                value={formData.phone}
                onChange={handleChange}
                className="px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
              />
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
              >
                <option value="inquiry">Pregunta</option>
                <option value="reservation">Sobre reservas</option>
                <option value="complaint">Sugerencia</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <input
              type="text"
              name="subject"
              placeholder="Asunto"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
            />

            <textarea
              name="message"
              placeholder="Tu mensaje..."
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-2 border border-arena rounded-lg focus:outline-none focus:border-jade"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brote hover:bg-ambar text-white font-body font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </form>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 md:py-24 bg-pergamino">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-display text-4xl text-selva mb-8 text-center">
            Ubicación
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display text-2xl text-selva mb-4">
                Paraiso Encantado
              </h3>
              <p className="font-body text-gray-700 mb-4">
                Xilitla, San Luis Potosí 79910, México
              </p>
              <p className="font-body text-gray-600 mb-4">
                A 7 minutos del centro de Xilitla y a pasos del Jardín Surrealista Edward James
              </p>
              <div className="space-y-2">
                <p className="font-body">
                  <strong>Teléfono:</strong>{' '}
                  <a href="tel:+524891007679" className="text-brote hover:underline">
                    +52 (489) 100-7679
                  </a>
                </p>
                <p className="font-body">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:reservas@paraisoencantado.com" className="text-brote hover:underline">
                    reservas@paraisoencantado.com
                  </a>
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-jade to-brote rounded-lg h-96 flex items-center justify-center text-white">
              <p className="font-body text-center">
                {/* TODO: Integrar Google Maps */}
                Mapa aquí (Google Maps API)
                <br />
                <span className="text-sm">Coordenadas: 21.3896, -98.9955</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
