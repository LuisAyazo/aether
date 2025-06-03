import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Ajustado para apuntar a infraux/app
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Ajustado para apuntar a infraux/components
  ],
  darkMode: 'class', // Asumiendo que infraux también usará modo oscuro
  theme: {
    extend: {
      fontFamily: {
        // Usar la variable CSS --font-inter definida en layout.tsx
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'], // Mantener Geist Mono para monoespaciado
      },
      colors: {
        'cloud-blue': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'electric-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        'emerald-green': {
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
        },
      },
      // Se pueden copiar animaciones y keyframes de landingPage/tailwind.config.ts si se necesitan
      // Por ahora, solo se incluyen colores y fuentes para la página de login.
      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'bounce-in': 'bounce-in 0.8s ease-out forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(20px)' },
          '50%': { transform: 'scale(1.02) translateY(-5px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
