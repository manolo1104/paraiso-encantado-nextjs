"use client";

import Link from "next/link";
import { hotelInfo } from "@/lib/data";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: "#152009", borderTop: "1px solid rgba(200,169,110,0.15)" }}>
      <div className="container mx-auto px-4 md:px-6 py-16">
        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Hotel info */}
          <div>
            <div
              className="font-display mb-1"
              style={{ fontSize: "15px", letterSpacing: "3px", textTransform: "uppercase", color: "#f7f2e8", fontWeight: 300 }}
            >
              Paraíso Encantado
            </div>
            <div
              className="font-body mb-5"
              style={{ fontSize: "9px", letterSpacing: "2.5px", textTransform: "uppercase", color: "#c8a96e" }}
            >
              Xilitla · Huasteca Potosina
            </div>
            <div
              className="font-display mb-4"
              style={{ fontSize: "18px", fontStyle: "italic", color: "rgba(240,235,224,0.55)", fontWeight: 300, lineHeight: 1.6 }}
            >
              "Donde la selva te recibe."
            </div>
            <div className="space-y-2" style={{ fontSize: "13px" }}>
              <p className="font-body" style={{ color: "rgba(240,235,224,0.5)", fontWeight: 300 }}>
                <a href={`tel:${hotelInfo.contact.phone}`} style={{ color: "rgba(240,235,224,0.7)" }}>
                  {hotelInfo.contact.phone}
                </a>
              </p>
              <p className="font-body" style={{ color: "rgba(240,235,224,0.5)", fontWeight: 300 }}>
                <a href={`mailto:${hotelInfo.contact.email}`} style={{ color: "rgba(240,235,224,0.7)" }}>
                  {hotelInfo.contact.email}
                </a>
              </p>
            </div>
          </div>

          {/* Navegación */}
          <div>
            <p
              className="font-body mb-5"
              style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}
            >
              Navegación
            </p>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Inicio" },
                { href: "/habitaciones", label: "Habitaciones" },
                { href: "/amenidades", label: "Amenidades" },
                { href: "/restaurante", label: "Restaurante" },
                { href: "/guia-huasteca", label: "Guía Huasteca" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-body"
                    style={{ fontSize: "13px", color: "rgba(240,235,224,0.55)", fontWeight: 300 }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Reservas */}
          <div>
            <p
              className="font-body mb-5"
              style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}
            >
              Reservas
            </p>
            <ul className="space-y-3">
              {[
                { href: "/booking", label: "Reservar Ahora" },
                { href: "/contacto", label: "Contacto" },
                { href: "/cancelacion", label: "Política de Cancelación" },
                { href: "/terminos", label: "Términos & Condiciones" },
                { href: "/privacidad", label: "Privacidad" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-body"
                    style={{ fontSize: "13px", color: "rgba(240,235,224,0.55)", fontWeight: 300 }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ubicación */}
          <div>
            <p
              className="font-body mb-5"
              style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e" }}
            >
              Ubicación
            </p>
            <div className="font-body space-y-2" style={{ fontSize: "13px", color: "rgba(240,235,224,0.55)", fontWeight: 300 }}>
              <p>{hotelInfo.location.city}</p>
              <p>{hotelInfo.location.address}</p>
              <p className="mt-4" style={{ color: "rgba(240,235,224,0.5)" }}>
                Check-in: <span style={{ color: "rgba(240,235,224,0.75)" }}>{hotelInfo.hours.checkIn}</span>
                <br />
                Check-out: <span style={{ color: "rgba(240,235,224,0.75)" }}>{hotelInfo.hours.checkOut}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ borderTop: "1px solid rgba(200,169,110,0.12)", marginBottom: "28px" }} />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body" style={{ fontSize: "11px", color: "rgba(240,235,224,0.35)", fontWeight: 300, letterSpacing: "0.5px" }}>
            &copy; {currentYear} Paraíso Encantado. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            {[
              { href: "https://www.instagram.com", label: "Instagram" },
              { href: "https://www.facebook.com", label: "Facebook" },
              { href: `https://wa.me/${hotelInfo.contact.whatsapp.replace(/\D/g, "")}`, label: "WhatsApp" },
            ].map(({ href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body"
                style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(240,235,224,0.35)" }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
