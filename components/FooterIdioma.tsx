'use client';

import { usePathname } from 'next/navigation';

// El enlace al otro idioma del pie (17 oct 2026). Va en el navegador, con la ruta
// de VERDAD: el pie se pinta desde el layout raíz, y un layout no se vuelve a pintar
// al navegar con <Link>. Calculado en el servidor con `headers()`, se quedaba con la
// primera página que se abrió: de /hotel-cerca-de-las-pozas a /en (con <Link>) el
// pie seguía diciendo «English» y enlazaba a la misma página.
//
// Es un <a> y no un <Link> a propósito: la carga completa hace que el servidor
// vuelva a pintar `<html lang>` (app/layout.tsx) en el idioma correcto.
// Se compara con '/en' exacto o '/en/' para no confundir rutas como /encuesta.
export default function FooterIdioma() {
  const pathname = usePathname() || '';
  const enIngles = pathname === '/en' || pathname.startsWith('/en/');
  return enIngles
    ? <li><a href="/" hrefLang="es" lang="es">Español</a></li>
    : <li><a href="/en" hrefLang="en" lang="en">English</a></li>;
}
