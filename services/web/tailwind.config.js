/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ── Brand colours ──────────────────────────────────────────────────────
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',   // primary
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle:  '#f8f7ff',
          muted:   '#f1f0f9',
        },
        border: {
          DEFAULT: '#e5e4f0',
          strong:  '#c8c6e0',
        },
        text: {
          primary:   '#1a1835',
          secondary: '#5c5a7a',
          muted:     '#9896b4',
          inverse:   '#ffffff',
        },
        success: { DEFAULT: '#22c55e', light: '#dcfce7' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7' },
        danger:  { DEFAULT: '#ef4444', light: '#fee2e2' },
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      // ── Spacing ────────────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
      },

      // ── Border radius ──────────────────────────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
      },

      // ── Shadows ────────────────────────────────────────────────────────────
      boxShadow: {
        card:   '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
        focus:  '0 0 0 3px rgb(124 58 237 / 0.25)',
      },
    },
  },
  plugins: [],
};
