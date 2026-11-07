/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { brand: { 50: '#eef0ff', 500: '#4b3fd1', 600: '#3d32b5', 700: '#31288f' } }
    }
  },
  plugins: []
};
