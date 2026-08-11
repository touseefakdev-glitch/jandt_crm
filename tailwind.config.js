/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // J&T Supplies Custom Brand Color Identity
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43', // Deep Navy Structural Primary
          950: '#091A2B',
        },
        teal: {
          50: '#E6F7F7',
          100: '#B3EBEB',
          200: '#80DFDF',
          300: '#4DD3D3',
          400: '#1AC7C7',
          500: '#00A6A6', // Electric Teal Primary Action & Accent
          600: '#008C8C',
          700: '#007373',
          800: '#005959',
          900: '#004040',
        },
        amber: {
          50: '#FEF9EE',
          100: '#FDF1D5',
          200: '#FAE3AA',
          300: '#F6D47F',
          400: '#F4C655',
          500: '#F2B84B', // Warm Amber Attention/Pending
          600: '#D99C2E',
          700: '#B37C1E',
          800: '#8C5E13',
          900: '#66410B',
        },
        green: {
          50: '#EAF5EF',
          100: '#C9E6D5',
          500: '#2E8B57', // Success Green
          600: '#247045',
          700: '#1B5434',
        },
        red: {
          50: '#FDF2F2',
          100: '#FADADA',
          500: '#D64545', // Error Red
          600: '#B83232',
          700: '#962424',
        },
        // Legacy Brand Mapping for smooth migration
        brand: {
          50: '#E6F7F7',
          100: '#B3EBEB',
          200: '#80DFDF',
          300: '#4DD3D3',
          400: '#1AC7C7',
          500: '#00A6A6',
          600: '#00A6A6',
          700: '#007373',
          800: '#102A43',
          900: '#102A43',
          950: '#091A2B',
        },
        surface: {
          bg: '#F5F7FA',       // Main Application Background
          card: '#FFFFFF',     // Cards Background
          muted: '#E9EFF5',    // Muted Sub-containers
          border: '#D9E2EC',   // Structural Borders
          text: '#172B4D',     // Primary Text
          secondary: '#52606D' // Secondary Text
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.01em' }], // 11px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        input: '8px',
        '2xs': '6px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(16 42 67 / 0.04)',
        // 3D Layer System — subtle, consistent depth
        card: '0 1px 3px 0 rgb(16 42 67 / 0.06), 0 1px 2px -1px rgb(16 42 67 / 0.04)',           // Layer 1
        'card-hover': '0 4px 12px -2px rgb(16 42 67 / 0.08), 0 2px 4px -2px rgb(16 42 67 / 0.04)',
        'elevated': '0 8px 20px -6px rgb(16 42 67 / 0.10), 0 3px 6px -4px rgb(16 42 67 / 0.05)',  // Layer 2
        popover: '0 10px 25px -5px rgb(16 42 67 / 0.12), 0 4px 6px -2px rgb(16 42 67 / 0.04)',
        overlay: '0 20px 40px -15px rgb(16 42 67 / 0.25)',                                       // Layer 3
        'ring-teal': '0 0 0 3px rgb(0 166 166 / 0.2)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'drawer-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'drawer-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'drawer-in-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out both',
        'slide-in-up': 'slide-in-up 0.18s ease-out both',
        'slide-in-right': 'slide-in-right 0.2s ease-out both',
        'scale-in': 'scale-in 0.15s ease-out both',
        'drawer-in-right': 'drawer-in-right 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'drawer-in-left': 'drawer-in-left 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'drawer-in-bottom': 'drawer-in-bottom 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
