/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effefb',
          100: '#c8fff4',
          200: '#91ffea',
          300: '#52f5dd',
          400: '#1ee0ca',
          500: '#06c4b1',
          600: '#029e92',
          700: '#077e76',
          800: '#0b6460',
          900: '#0e534f',
          950: '#003332',
        },
        surface: {
          0: '#ffffff',
          50: '#f8fafb',
          100: '#f1f4f6',
          200: '#e4e9ed',
          300: '#d1d8df',
          400: '#9ba5b0',
          500: '#6b7785',
          600: '#4a5567',
          700: '#364152',
          800: '#1e2a3a',
          900: '#111a27',
          950: '#0a1018',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'sidebar': '1px 0 0 0 rgb(0 0 0 / 0.06)',
      },
      animation: {
        'progress': 'progress 1s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        progress: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: 'var(--progress-value)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
