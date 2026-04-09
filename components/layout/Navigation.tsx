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
          className="font-body transition-colors duration-200"
          style={{
            fontSize: "10px",
            fontWeight: 400,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: "rgba(240,235,224,0.6)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#c8a96e")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,235,224,0.6)")}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
