/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cb-bg': '#0a0a0f',
        'cb-card': '#111118',
        'cb-border': '#1e1e2e',
        'cb-lime': '#d4f53c',
        'cb-blue': '#3b82f6',
      },
    },
  },
  plugins: [],
}
