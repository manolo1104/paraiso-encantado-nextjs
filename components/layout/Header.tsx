"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Navigation from "./Navigation";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(21, 32, 9, 0.94)",
        borderBottom: "1px solid rgba(200, 169, 110, 0.18)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="https://booking-paraisoencantado.up.railway.app/images/logo.png"
            alt="Paraiso Encantado"
            width={40}
            height={40}
            className="object-contain"
            unoptimized
          />
          <div>
            <span
              className="font-display block leading-none"
              style={{ fontSize: "17px", letterSpacing: "3px", textTransform: "uppercase", color: "#f7f2e8", fontWeight: 300 }}
            >
              Paraíso Encantado
            </span>
            <span
              className="font-body block"
              style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: "#c8a96e", marginTop: "2px" }}
            >
              Xilitla · Huasteca Potosina
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <Navigation />

        {/* CTA Button (Desktop) */}
        <div className="hidden md:block">
          <Link
            href="/booking"
            className="font-body transition-colors duration-200"
            style={{
              background: "#c8a96e",
              color: "#152009",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "3px",
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: "2px",
              display: "inline-block",
            }}
          >
            Reservar
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col space-y-1.5 w-8 h-8 items-center justify-center"
          aria-label="Menu"
        >
          <span className={`block w-5 h-px transition-transform duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-[5px]" : ""}`}
            style={{ background: "#c8a96e" }} />
          <span className={`block w-5 h-px transition-opacity duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`}
            style={{ background: "#c8a96e" }} />
          <span className={`block w-5 h-px transition-transform duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-[5px]" : ""}`}
            style={{ background: "#c8a96e" }} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{ background: "#1e3012", borderTop: "1px solid rgba(200,169,110,0.15)" }}
        >
          <div className="container mx-auto px-4 py-5 flex flex-col gap-4">
            {[
              { href: "/", label: "Inicio" },
              { href: "/habitaciones", label: "Habitaciones" },
              { href: "/amenidades", label: "Amenidades" },
              { href: "/restaurante", label: "Restaurante" },
              { href: "/guia-huasteca", label: "Guía Huasteca" },
              { href: "/contacto", label: "Contacto" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-body"
                style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(240,235,224,0.7)" }}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/booking"
              className="font-body text-center mt-2"
              style={{
                background: "#c8a96e",
                color: "#152009",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "3px",
                textTransform: "uppercase",
                padding: "12px 22px",
                borderRadius: "2px",
                display: "block",
              }}
            >
              Reservar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
