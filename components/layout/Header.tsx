"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Navigation from "./Navigation";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-cream border-b border-parchment sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="https://booking-paraisoencantado.up.railway.app/images/logo.png"
            alt="Paraiso Encantado"
            width={48}
            height={48}
            className="object-contain"
            unoptimized
          />
          <span className="font-display text-xl font-bold text-selva tracking-wide">Paraiso Encantado</span>
        </Link>

        {/* Desktop Navigation */}
        <Navigation />

        {/* CTA Button (Desktop) */}
        <div className="hidden md:block">
          <Link
            href="/booking"
            className="bg-brote hover:bg-ambar text-white font-body font-semibold px-6 py-2.5 rounded-lg transition-colors duration-200"
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
          <span
            className={`block w-6 h-0.5 bg-selva transition-transform duration-300 ${
              mobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-selva transition-opacity duration-300 ${
              mobileMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-selva transition-transform duration-300 ${
              mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-pergamino border-t border-jade">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link href="/" className="block font-body text-sm font-medium text-selva hover:text-jade">
              Inicio
            </Link>
            <Link href="/habitaciones" className="block font-body text-sm font-medium text-selva hover:text-jade">
              Habitaciones
            </Link>
            <Link href="/amenidades" className="block font-body text-sm font-medium text-selva hover:text-jade">
              Amenidades
            </Link>
            <Link href="/restaurante" className="block font-body text-sm font-medium text-selva hover:text-jade">
              Restaurante
            </Link>
            <Link href="/guia-huasteca" className="block font-body text-sm font-medium text-selva hover:text-jade">
              Guía Huasteca
            </Link>
            <Link href="/contacto" className="block font-body text-sm font-medium text-selva hover:text-jade">
              Contacto
            </Link>
            <Link
              href="/booking"
              className="block bg-brote hover:bg-ambar text-white font-body font-semibold px-6 py-2.5 rounded-lg transition-colors duration-200 text-center"
            >
              Reservar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
