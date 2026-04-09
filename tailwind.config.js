/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        selva:     '#1a2e1a',
        bosque:    '#243524',
        musgo:     '#2d3d2d',
        arena:     '#c8b68e',
        pergamino: '#f5f0e8',
        jade:      '#2d5a3d',
        brote:     '#4a7c5c',
        ambar:     '#d4a857',
        corteza:   '#5c4a3a',
        gold:      '#b8a472',
        'cream':   '#f7f2e8',
        'parchment': '#ede0c4',
        'parchment-soft': '#f3ead8',
        'ink':     '#3d2b14',
        'ink-soft': '#6b4c28',
        'accent':  '#8a6428',
        'accent-hero': '#f6dfb2',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"Jost"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
