'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { rooms } from '@/lib/data';

export default function HabitacionesPage() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const roomTypes = ['all', ...new Set(rooms.map((r) => r.type))];

  const filteredRooms = useMemo(() => {
    if (selectedType === 'all') return rooms;
    return rooms.filter((r) => r.type === selectedType);
  }, [selectedType]);

  return (
    <main className="w-full" style={{ background: "#0f0d0a", color: "#f7f2e8" }}>
      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "50vh", padding: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 120% 100% at 50% 120%, #1e3012 0%, #0f0d0a 60%)",
          }}
        />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p
            className="font-body mb-5"
            style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            Alojamiento
          </p>
          <h1
            className="font-display mb-5"
            style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}
          >
            Nuestras <span style={{ color: "#c8a96e" }}>Suites</span>
          </h1>
          <p
            className="font-body mx-auto"
            style={{ color: "rgba(240,235,224,0.55)", maxWidth: "520px", fontWeight: 300, lineHeight: 1.85 }}
          >
            Quince espacios únicos, cada uno diseñado para ofrecer privacidad absoluta y lujo en la naturaleza.
          </p>
        </div>
      </section>

      {/* ── FILTERS ── */}
      <section style={{ background: "#0f0d0a", padding: "48px 0 0" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {roomTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className="font-body transition-all duration-200"
                style={{
                  padding: "10px 22px",
                  borderRadius: "2px",
                  fontSize: "10px",
                  fontWeight: selectedType === type ? 600 : 400,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  background: selectedType === type ? "#c8a96e" : "transparent",
                  color: selectedType === type ? "#152009" : "rgba(240,235,224,0.6)",
                  border: selectedType === type
                    ? "1px solid #c8a96e"
                    : "1px solid rgba(200,169,110,0.25)",
                  cursor: "pointer",
                }}
              >
                {type === 'all' ? 'Todas' : type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROOMS GRID ── */}
      <section style={{ background: "#0f0d0a", padding: "64px 0 96px" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{ background: "rgba(200,169,110,0.1)" }}
          >
            {filteredRooms.map((room) => (
              <Link key={room.id} href={`/habitaciones/${room.id}`}>
                <div className="group" style={{ background: "#0f0d0a" }}>
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ height: "240px" }}>
                    <Image
                      src={room.cover}
                      alt={room.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0" style={{ background: "rgba(15,13,10,0.25)" }} />
                  </div>

                  {/* Info */}
                  <div style={{ padding: "24px 28px 28px", borderTop: "1px solid rgba(200,169,110,0.1)" }}>
                    <p
                      className="font-body mb-2"
                      style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}
                    >
                      {room.type}
                    </p>
                    <h3
                      className="font-display mb-3"
                      style={{ fontSize: "22px", color: "#f7f2e8", fontWeight: 300 }}
                    >
                      {room.name}
                    </h3>
                    <p
                      className="font-body mb-4"
                      style={{ fontSize: "13px", color: "rgba(240,235,224,0.5)", fontWeight: 300, lineHeight: 1.75 }}
                    >
                      {room.description}
                    </p>

                    <div className="flex gap-4 mb-5" style={{ fontSize: "11px", color: "rgba(240,235,224,0.35)" }}>
                      <span className="font-body">🛏 {room.bedType}</span>
                      <span className="font-body">👥 Hasta {room.maxGuests}</span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <span className="font-body" style={{ fontSize: "10px", color: "rgba(240,235,224,0.4)", letterSpacing: "1px", display: "block" }}>
                          Desde
                        </span>
                        <span className="font-display" style={{ fontSize: "24px", color: "#c8a96e", fontWeight: 300 }}>
                          ${room.price.toLocaleString("es-MX")}
                          <span className="font-body" style={{ fontSize: "11px", color: "rgba(240,235,224,0.4)", fontWeight: 300 }}>
                            {" "}MXN/noche
                          </span>
                        </span>
                      </div>
                      <span
                        className="font-body"
                        style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: "#c8a96e", borderBottom: "1px solid rgba(200,169,110,0.4)", paddingBottom: "2px" }}
                      >
                        Ver Suite →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section
        style={{
          background: "radial-gradient(ellipse 100% 80% at 50% 100%, #1e3012 0%, #0f0d0a 65%)",
          padding: "120px 0",
          textAlign: "center",
        }}
      >
        <div className="container mx-auto px-6">
          <p
            className="font-body mb-6"
            style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase", color: "#c8a96e" }}
          >
            Reserva Directa · Mejor Precio Garantizado
          </p>
          <h2
            className="font-display mb-6"
            style={{ color: "#f7f2e8", fontStyle: "italic", fontWeight: 300 }}
          >
            ¿Tu suite perfecta<br /><em style={{ color: "#c8a96e" }}>te espera?</em>
          </h2>
          <p
            className="font-body mb-10 mx-auto"
            style={{ color: "rgba(240,235,224,0.55)", maxWidth: "480px", fontWeight: 300 }}
          >
            Cada habitación en Paraíso Encantado es una experiencia única. Reserva directamente y obtén el mejor precio.
          </p>
          <Link
            href="/booking"
            className="font-body"
            style={{
              background: "#c8a96e",
              color: "#152009",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "3px",
              textTransform: "uppercase",
              padding: "16px 40px",
              borderRadius: "2px",
              display: "inline-block",
            }}
          >
            Reservar Ahora
          </Link>
        </div>
      </section>
    </main>
  );
}
