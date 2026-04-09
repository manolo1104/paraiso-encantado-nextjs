"use client";

import Link from "next/link";
import { useState } from "react";
import Navigation from "./Navigation";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-12 h-12 flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-selva"
              fill="currentColor"
            >
              {/* Simple leaf/plant icon */}
              <path d="M50 10C50 10 30 30 30 50C30 70 40 85 50 85C60 85 70 70 70 50C70 30 50 10 50 10Z" />
              <circle cx="45" cy="45" r="4" fill="white" />
            </svg>
          </div>
          <span className="font-display text-xl font-bold text-selva">Paraiso</span>
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
