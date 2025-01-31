/** @type {import('tailwindcss').Config} */
export default {
  content: ['./*.html', './src/**/*.{js,jsx,ts,tsx}', './index.js'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', 'sans-serif'],
      },
      height: {
        'title-bar': '35px',
      },
      width: {
        'calendar-view': 'calc(100vw - 250px)',
        nav: '250px',
      },
      colors: {
        sidebar: '#323335',
        'gray-68': '#444444',
        'gray-99': '#636363',
        hoverButton: '#5e6266',
      },
      borderColor: {
        'gray-40': 'rgba(128, 128, 128, 0.4)',
      },
    },
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '100%',
        md: '100%',
        lg: '100%',
        xl: '100%',
        '2xl': '100%',
      },
    },
  },
  plugins: [],
};
