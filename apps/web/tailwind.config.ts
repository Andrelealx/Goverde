import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D6A4F',
          50: '#E8F5EE',
          100: '#C3E6D3',
          200: '#9DD7B8',
          300: '#77C89D',
          400: '#52B982',
          500: '#2D6A4F',
          600: '#245540',
          700: '#1B4030',
          800: '#122B20',
          900: '#091610',
        },
        secondary: {
          DEFAULT: '#1B4F72',
          500: '#1B4F72',
          600: '#154060',
        },
        success: '#40916C',
        warning: '#F4A261',
        danger: '#E63946',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
