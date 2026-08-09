/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0effe',
          100: '#e4e1fd',
          200: '#ccc6fc',
          300: '#aa9ef9',
          400: '#876ef4',
          500: '#6a47ee',
          600: '#5a2ae3',
          700: '#4c1fcf',
          800: '#3f1daa',
          900: '#351a88',
          950: '#1f0e5c',
        },
        surface: {
          DEFAULT: '#0d0d14',
          1: '#12121c',
          2: '#18182a',
          3: '#1e1e35',
          4: '#252543',
        },
        // Neural Flux Redesign Tokens
        charcoal: '#141416',
        lavender: '#8875B8',
        sage: '#6B8E76',
        'off-white': '#F0EFEB',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
        satoshi: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3.75rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(106,71,238,0.25), transparent)',
        'neural-cascade': 'linear-gradient(to bottom right, var(--off-white), var(--lavender), var(--sage))',
      },
      transitionTimingFunction: {
        'neural-flow': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
      },
    },
  },
  plugins: [],
};
