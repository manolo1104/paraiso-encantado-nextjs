/** @type {import('tailwindcss').Config} */
// NOTE: Tailwind v4 lee tokens desde @theme en globals.css, no desde aquí.
// Este archivo sirve como documentación de la paleta oficial.
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta primaria — Branding Guide 2026
        selva:     '#152009',   // Base / fondos oscuros
        bosque:    '#1e3012',   // Principal / headers
        musgo:     '#2d4a1a',   // Secundario / CTAs
        arena:     '#c8a96e',   // Acento de lujo (Arena Dorada)
        pergamino: '#ede0c4',   // Fondos claros / tarjetas

        // Paleta de apoyo
        jade:    '#4a6e2e',
        brote:   '#7aaa52',
        ambar:   '#a8842a',
        corteza: '#6b4c28',

        // Neutros
        ink:     '#0f0d0a',
        bark:    '#3d2b14',
        clay:    '#6b4c28',
        cream:   '#f7f2e8',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"Jost"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
