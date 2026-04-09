"use client";

import Link from "next/link";
import { hotelInfo } from "@/lib/data";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-selva text-white mt-24">
      <div className="container mx-auto px-4 md:px-6 py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Hotel Info */}
          <div>
            <h3 className="font-display text-xl font-bold mb-4 text-brote">Paraiso Encantado</h3>
            <p className="font-body text-sm text-white/80 mb-4">
              Tu casa en la Huasteca Potosina
            </p>
            <div className="space-y-2 text-sm font-body">
              <p className="text-white/80">
                <span className="font-semibold text-pergamino">Teléfono:</span>
                <br />
                <a href={`tel:${hotelInfo.contact.phone}`} className="hover:text-brote transition-colors">
                  {hotelInfo.contact.phone}
                </a>
              </p>
              <p className="text-white/80">
                <span className="font-semibold text-pergamino">Email:</span>
                <br />
                <a href={`mailto:${hotelInfo.contact.email}`} className="hover:text-brote transition-colors">
                  {hotelInfo.contact.email}
                </a>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-brote">Navegación</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="font-body text-sm text-white/80 hover:text-brote transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/habitaciones" className="font-body text-sm text-white/80 hover:text-brote transition-colors">
                  Habitaciones
                </Link>
              </li>
              <li>
                <Link href="/amenidades" className="font-body text-sm text-white/80 hover:text-brote transition-colors">
                  Amenidades
                </Link>
              </li>
              <li>
                <Link href="/restaurante" className="font-body text-sm text-white/80 hover:text-brote transition-colors">
                  Restaurante
                </Link>
              </li>
              <li>
                <Link href="/guia-huasteca" className="font-body text-sm text-white/80 hover:text-brote transition-colors">
                  Guía Huasteca
                </Link>
              </li>
            </ul>
          </div>

          {/* Booking Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-brote">Reservas</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/booking" className="font-body text-sm text-white/80 hover:text-brote transition-colors">
                  Reservar Ahora
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="font-body text-sm text-white/80 hover:text-brote transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="font-body text-sm text-white/80 hover:text-brote transition-colors">
                  Términos & Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="font-body text-sm text-white/80 hover:text-brote transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Ubicación */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-brote">Ubicación</h4>
            <div className="font-body text-sm text-white/80 space-y-2">
              <p>{hotelInfo.location.city}</p>
              <p>{hotelInfo.location.address}</p>
              <p className="mt-4">
                <strong className="text-pergamino">Check-in:</strong> {hotelInfo.hours.checkIn}
                <br />
                <strong className="text-pergamino">Check-out:</strong> {hotelInfo.hours.checkOut}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="font-body text-sm text-white/70">
            &copy; {currentYear} Paraiso Encantado. Todos los derechos reservados.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-brote transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-brote transition-colors"
            >
              Facebook
            </a>
            <a
              href={`https://wa.me/${hotelInfo.contact.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-brote transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
