/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#080808',
        'surface': '#111111',
        'surface-2': '#141414',
        'surface-3': '#1a1a1a',
        'border': '#1f1f1f',
        'border-2': '#2a2a2a',
        'muted': '#555555',
        'muted-2': '#888888',
        'body': '#b0b0b0',
        'primary': '#f0f0f0',
        'error-bg': '#2a1a1a',
        'error': '#ff6b6b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'fade-up': 'fadeUp 300ms ease forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'thinking': 'thinking 1.4s ease-in-out infinite',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.4, transform: 'scale(0.85)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        thinking: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.3 },
          '40%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
