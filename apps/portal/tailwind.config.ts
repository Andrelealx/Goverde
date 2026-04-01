import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D6A4F',
          50: '#E8F5EE',
          100: '#D1EBE0',
          200: '#A3D7C0',
          300: '#74C4A1',
          400: '#46B081',
          500: '#2D6A4F',
          600: '#245540',
          700: '#1B4030',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
