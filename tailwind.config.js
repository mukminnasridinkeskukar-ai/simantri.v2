/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,html}',
    './public/fragments/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — Clean Health + Energetic SaaS (Vercel + Doctolib vibe)
        base: '#FFFFFF',
        ink: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        teal: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488', // PRIMARY
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        lime: {
          50:  '#F7FEE7',
          100: '#ECFCCB',
          200: '#D9F99D',
          300: '#BEF264',
          400: '#A3E635',
          500: '#84CC16', // ACCENT
          600: '#65A30D',
          700: '#4D7C0F',
        },
        amber: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // ALERT
          600: '#D97706',
          700: '#B45309',
        },
        rose: {
          50:  '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E', // DANGER
          600: '#E11D48',
          700: '#BE123C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'soft':   '0 1px 2px 0 rgba(15,23,42,0.04), 0 4px 16px -2px rgba(15,23,42,0.06)',
        'card':   '0 1px 3px 0 rgba(15,23,42,0.05), 0 10px 30px -10px rgba(15,23,42,0.10)',
        'glow':   '0 0 0 3px rgba(13,148,136,0.18), 0 8px 24px -8px rgba(13,148,136,0.35)',
        'lime':   '0 0 0 3px rgba(132,204,22,0.20), 0 8px 24px -8px rgba(132,204,22,0.35)',
      },
      borderRadius: {
        'xl2': '1.25rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in':    { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'shimmer':    { '0%': { backgroundPosition: '-468px 0' }, '100%': { backgroundPosition: '468px 0' } },
        'pulse-dot':  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
      animation: {
        'fade-in':   'fade-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':   'shimmer 1.4s linear infinite',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
