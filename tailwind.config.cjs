/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-soft': '#f5f5fb',
        sidebar: '#f0ecff',
        primary: '#5b6bff',
        'primary-soft': '#eef0ff',
        'border-soft': '#e3e4f0',
      },
    },
  },
  plugins: [],
}

