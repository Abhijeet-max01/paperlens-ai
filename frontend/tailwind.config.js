/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        archival: {
          950: '#0c1014', // Deepest canvas
          900: '#12171d', // Primary surface
          850: '#161c24', // Card surface
          800: '#1d2530', // Elevated surface
          750: '#252f3d', // Card hover / border
          700: '#323e4f', // Border line
          600: '#4a5b73', // Subtle separator
          500: '#677b96', // Muted text
          400: '#94a3b8', // Secondary text
          300: '#cbd5e1', // Primary text muted
          200: '#e2e8f0', // Primary text bright
          100: '#f1f5f9', // Heading text
        },
        parchment: {
          50: '#faf8f5',
          100: '#f4ede2',
          200: '#e8dbcb',
          300: '#d7c2ab',
          400: '#bfa085',
          500: '#a38166',
          900: '#352417',
          950: '#1f130b',
        },
        forest: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        copper: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#064e3b',
          900: '#022c22',
          950: '#011c15',
        }
      }
    },
  },
  plugins: [],
}
