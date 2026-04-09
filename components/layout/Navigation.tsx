"use client";

import Link from "next/link";

const menuItems = [
  { label: "Inicio", href: "/" },
  { label: "Habitaciones", href: "/habitaciones" },
  { label: "Amenidades", href: "/amenidades" },
  { label: "Restaurante", href: "/restaurante" },
  { label: "Guía Huasteca", href: "/guia-huasteca" },
  { label: "Contacto", href: "/contacto" },
];

export default function Navigation() {
  return (
    <nav className="hidden md:flex items-center space-x-8">
      {menuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="font-body text-sm font-medium text-selva hover:text-jade transition-colors duration-200"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
