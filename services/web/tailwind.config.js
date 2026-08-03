/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // xs = 480px — used to show the sparkline panel on small phones in landscape
        xs: '480px',
      },
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
        // ── Semantic tokens — light ────────────────────────────────────────
        surface: {
          DEFAULT: 'var(--color-surface)',
          subtle:  'var(--color-surface-subtle)',
          muted:   'var(--color-surface-muted)',
          overlay: 'var(--color-surface-overlay)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
          inverse:   'var(--color-text-inverse)',
        },
        success: {
          DEFAULT: '#22c55e',
          light: 'var(--color-success-light)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: 'var(--color-warning-light)',
        },
        danger:  {
          DEFAULT: '#ef4444',
          light: 'var(--color-danger-light)',
        },
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter var', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.025em' }],
        '5xl': ['3rem',     { lineHeight: '1',        letterSpacing: '-0.03em' }],
      },

      // ── Spacing ────────────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '60': '15rem',
        '64': '16rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
      },

      // ── Border radius ──────────────────────────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // ── Shadows ────────────────────────────────────────────────────────────
      boxShadow: {
        'xs':       '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'card':     '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md':  '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'card-lg':  '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
        'card-xl':  '0 20px 25px -5px rgb(0 0 0 / 0.09), 0 8px 10px -6px rgb(0 0 0 / 0.09)',
        'glow-brand': '0 0 24px rgb(124 58 237 / 0.25)',
        'focus':    '0 0 0 3px rgb(124 58 237 / 0.25)',
        'sidebar':  '0 30px 80px rgb(8 15 40 / 0.45)',
        'modal':    '0 24px 60px rgb(15 23 42 / 0.18)',
        // Dark mode shadows
        'card-dark':    '0 1px 3px 0 rgb(0 0 0 / 0.2), 0 1px 2px -1px rgb(0 0 0 / 0.2)',
        'card-md-dark': '0 4px 6px -1px rgb(0 0 0 / 0.25), 0 2px 4px -2px rgb(0 0 0 / 0.25)',
      },

      // ── Animation ──────────────────────────────────────────────────────────
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(124 58 237 / 0.3)' },
          '50%':      { boxShadow: '0 0 0 8px rgb(124 58 237 / 0)' },
        },
        'skeleton': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      animation: {
        'fade-in':        'fade-in 0.2s ease-out',
        'fade-up':        'fade-up 0.3s ease-out',
        'slide-in-left':  'slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer':        'shimmer 1.5s infinite',
        'pulse-glow':     'pulse-glow 2s ease-in-out infinite',
        'skeleton':       'skeleton 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
